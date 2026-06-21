function decodeHtml(value) {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export function createBrowserTranslationApi({
  fetchImpl = fetch,
  timeoutMs = 7000,
  retries = 1
} = {}) {
  const cache = new Map();

  async function translate(text) {
    const clean = String(text ?? "").trim();
    const key = clean.toLocaleLowerCase("en");
    if (cache.has(key)) return { text: cache.get(key), available: true };

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", clean);
    url.searchParams.set("langpair", "en|zh-CN");

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const translated = decodeHtml(body?.responseData?.translatedText ?? "").trim();
        if (!translated || /MYMEMORY WARNING/i.test(translated)) throw new Error("无效翻译");
        cache.set(key, translated);
        return { text: translated, available: true };
      } catch {
        if (attempt === retries) return { text: "翻译暂不可用", available: false };
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  return {
    translateSentences(sentences) {
      return Promise.all(sentences.map(translate));
    },
    async lookupWord(word) {
      const normalized = String(word ?? "").trim().toLocaleLowerCase("en");
      const result = await translate(normalized);
      return {
        word: normalized,
        meaning: result.text,
        available: result.available
      };
    }
  };
}
