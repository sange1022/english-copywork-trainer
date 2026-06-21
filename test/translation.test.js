import test from "node:test";
import assert from "node:assert/strict";
import { createTranslator } from "../src/translation.js";

function memoryCache() {
  const values = new Map();
  return {
    get: async (key) => values.get(key),
    set: async (key, value) => values.set(key, value)
  };
}

test("返回在线翻译结果并写入缓存", async () => {
  let calls = 0;
  const translator = createTranslator({
    cache: memoryCache(),
    fetchImpl: async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({ responseData: { translatedText: "你好，世界！" } })
      };
    }
  });

  assert.deepEqual(await translator.translateSentence("Hello world!"), {
    text: "你好，世界！",
    available: true
  });
  assert.deepEqual(await translator.translateSentence("Hello world!"), {
    text: "你好，世界！",
    available: true
  });
  assert.equal(calls, 1);
});

test("网络失败时返回可继续练习的降级结果", async () => {
  const translator = createTranslator({
    cache: memoryCache(),
    retries: 0,
    fetchImpl: async () => {
      throw new Error("offline");
    }
  });

  assert.deepEqual(await translator.translateSentence("Hello"), {
    text: "翻译暂不可用",
    available: false
  });
});

test("单词查询返回统一结构", async () => {
  const translator = createTranslator({
    cache: memoryCache(),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ responseData: { translatedText: "学习" } })
    })
  });

  assert.deepEqual(await translator.lookupWord("Learning"), {
    word: "learning",
    meaning: "学习",
    available: true
  });
});
