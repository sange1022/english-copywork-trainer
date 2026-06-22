import test from "node:test";
import assert from "node:assert/strict";
import { detectPracticeMode, splitSentences, tokenizeWords } from "../src/text.js";

test("按标点分句并保留句末标点", () => {
  assert.deepEqual(
    splitSentences('Hello world! "How are you?" I am fine'),
    ["Hello world!", '"How are you?"', "I am fine"]
  );
});

test("规范空白并保护常见英文缩写", () => {
  assert.deepEqual(
    splitSentences("Dr. Smith is here.\n\nHe brought e.g. a notebook."),
    ["Dr. Smith is here.", "He brought e.g. a notebook."]
  );
});

test("把单词变成可查询片段并保留标点空格", () => {
  assert.deepEqual(tokenizeWords("Hello, world!"), [
    { text: "Hello", lookup: "hello" },
    { text: ", ", lookup: null },
    { text: "world", lookup: "world" },
    { text: "!", lookup: null }
  ]);
});

test("内容包含汉字时识别为中文模式", () => {
  assert.equal(detectPracticeMode("你好 world"), "chinese");
  assert.equal(detectPracticeMode("Hello world!"), "english");
});

test("按中文句末标点自动分句", () => {
  assert.deepEqual(splitSentences("你好世界！今天怎么样？我很好。"), [
    "你好世界！",
    "今天怎么样？",
    "我很好。"
  ]);
});
