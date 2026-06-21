import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "../src/server.js";

async function withServer(run) {
  const translator = {
    translateSentence: async (sentence) => ({ text: `中：${sentence}`, available: true }),
    lookupWord: async (word) => ({ word, meaning: `释义：${word}`, available: true })
  };
  const server = createServer({ translator });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("提供健康检查和首页", async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/health`);
    assert.deepEqual(await health.json(), { ok: true });
    const home = await fetch(baseUrl);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /英文打字临摹/);
  });
});

test("批量翻译句子并查询单词", async () => {
  await withServer(async (baseUrl) => {
    const translation = await fetch(`${baseUrl}/api/translate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sentences: ["Hello!"] })
    });
    assert.deepEqual(await translation.json(), {
      translations: [{ text: "中：Hello!", available: true }]
    });

    const word = await fetch(`${baseUrl}/api/word`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ word: "hello" })
    });
    assert.deepEqual(await word.json(), {
      word: "hello",
      meaning: "释义：hello",
      available: true
    });
  });
});

test("拒绝空句子请求", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/translate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sentences: [] })
    });
    assert.equal(response.status, 400);
  });
});
