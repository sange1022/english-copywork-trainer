const ABBREVIATIONS = [
  "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "St.",
  "e.g.", "i.e.", "etc.", "vs."
];

function protectAbbreviations(text) {
  let protectedText = text;
  const values = [];

  for (const abbreviation of ABBREVIATIONS) {
    const token = `\uE000${values.length}\uE001`;
    const pattern = new RegExp(
      abbreviation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    if (pattern.test(protectedText)) {
      values.push(abbreviation);
      protectedText = protectedText.replace(pattern, token);
    }
  }

  return {
    text: protectedText,
    restore(value) {
      return value.replace(/\uE000(\d+)\uE001/g, (_, index) => values[Number(index)]);
    }
  };
}

export function splitSentences(input) {
  const normalized = String(input ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const protectedValue = protectAbbreviations(normalized);
  const matches = protectedValue.text.match(/.*?[.!?。！？]+(?:["'”’)\]]+)?(?=\s|$|[^\s])|.+$/g) ?? [];

  return matches
    .map((sentence) => protectedValue.restore(sentence.trim()))
    .filter(Boolean);
}

export function detectPracticeMode(text) {
  return /[\u3400-\u9FFF]/u.test(String(text ?? "")) ? "chinese" : "english";
}

export function tokenizeWords(sentence) {
  const tokens = [];
  const pattern = /[\p{L}]+(?:['’][\p{L}]+)*/gu;
  let cursor = 0;

  for (const match of String(sentence ?? "").matchAll(pattern)) {
    if (match.index > cursor) {
      tokens.push({ text: sentence.slice(cursor, match.index), lookup: null });
    }
    tokens.push({ text: match[0], lookup: match[0].toLocaleLowerCase("en") });
    cursor = match.index + match[0].length;
  }

  if (cursor < sentence.length) {
    tokens.push({ text: sentence.slice(cursor), lookup: null });
  }

  return tokens;
}
