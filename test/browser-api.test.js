import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserTranslationApi } from "../public/browser-api.js";

test("浏览器翻译接口返回句子中文", async () => {
  const api = createBrowserTranslationApi({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ responseData: { translatedText: "你好。" } })
    })
  });

  assert.deepEqual(await api.translateSentences(["Hello."]), [
    { text: "你好。", available: true }
  ]);
});

test("浏览器翻译失败时返回降级结果", async () => {
  const api = createBrowserTranslationApi({
    fetchImpl: async () => {
      throw new Error("offline");
    },
    retries: 0
  });

  assert.deepEqual(await api.translateSentences(["Hello."]), [
    { text: "翻译暂不可用", available: false }
  ]);
});

test("浏览器单词查询返回统一格式", async () => {
  const api = createBrowserTranslationApi({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ responseData: { translatedText: "学习" } })
    })
  });

  assert.deepEqual(await api.lookupWord("Learning"), {
    word: "learning",
    meaning: "学习",
    available: true
  });
});
