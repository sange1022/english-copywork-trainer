function decodeHtml(value) {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function requestTranslation(text, { fetchImpl, timeoutMs, retries }) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "en|zh-CN");

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      const translated = decodeHtml(body?.responseData?.translatedText ?? "").trim();
      if (!translated || /MYMEMORY WARNING/i.test(translated)) {
        throw new Error("Invalid translation response");
      }
      return translated;
    } catch (error) {
      if (attempt === retries) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createTranslator({
  fetchImpl = fetch,
  cache = { get: async () => undefined, set: async () => {} },
  timeoutMs = 6000,
  retries = 1
} = {}) {
  async function translate(text, prefix) {
    const clean = String(text ?? "").trim();
    const key = `${prefix}:${clean.toLocaleLowerCase("en")}`;
    const cached = await cache.get(key);
    if (cached) return { text: cached, available: true };

    try {
      const translated = await requestTranslation(clean, { fetchImpl, timeoutMs, retries });
      await cache.set(key, translated);
      return { text: translated, available: true };
    } catch {
      return { text: "翻译暂不可用", available: false };
    }
  }

  return {
    translateSentence(sentence) {
      return translate(sentence, "sentence");
    },
    async lookupWord(word) {
      const normalized = String(word ?? "").trim().toLocaleLowerCase("en");
      const result = await translate(normalized, "word");
      return {
        word: normalized,
        meaning: result.text,
        available: result.available
      };
    }
  };
}
