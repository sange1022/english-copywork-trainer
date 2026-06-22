import test from "node:test";
import assert from "node:assert/strict";
import { splitSentences, tokenizeWords } from "../src/text.js";

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
