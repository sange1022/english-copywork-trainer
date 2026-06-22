import test from "node:test";
import assert from "node:assert/strict";
import {
  accuracyFor,
  applyKey,
  applyText,
  countPracticeCharacters,
  createTypingState
} from "../src/typing.js";

test("只输入字母即可自动跳过标点并完成", () => {
  let state = createTypingState("Hi!");
  state = applyKey(state, "h");
  state = applyKey(state, "i");
  assert.equal(state.index, 3);
  assert.equal(state.complete, true);
});

test("大小写不影响字母匹配", () => {
  let state = createTypingState("Apple");
  for (const key of "aPPLE") state = applyKey(state, key);
  assert.equal(state.complete, true);
});

test("空格和标点自动跳过，不需要输入", () => {
  let state = createTypingState('"I am fine."');
  for (const key of "iamfine") state = applyKey(state, key);
  assert.equal(state.index, 12);
  assert.equal(state.complete, true);
});

test("主动输入空格或标点时忽略且不算错误", () => {
  let state = createTypingState("Hi, Tom!");
  state = applyKey(state, "h");
  state = applyKey(state, ",");
  state = applyKey(state, " ");
  assert.equal(state.index, 1);
  assert.equal(state.errors, 0);
  assert.equal(state.error, "");
});

test("统计时只计算英文字母", () => {
  assert.equal(countPracticeCharacters("Hi, Tom! 123", "english"), 5);
});

test("错误字符变为阻塞状态，退格后才能继续", () => {
  let state = applyKey(createTypingState("cat"), "x");
  assert.equal(state.error, "x");
  assert.equal(state.index, 0);
  state = applyKey(state, "c");
  assert.equal(state.index, 0);
  state = applyKey(state, "Backspace");
  state = applyKey(state, "c");
  assert.equal(state.index, 1);
  assert.equal(state.errors, 1);
});

test("正确率包含已经修正的错误按键", () => {
  assert.equal(accuracyFor(100, 4), 96.2);
});

test("还没有正确字符但已经输错时正确率为零", () => {
  assert.equal(accuracyFor(0, 1), 0);
});

test("中文模式只校验汉字并自动跳过其他字符", () => {
  let state = createTypingState("你A好，世界！123", "chinese");
  state = applyText(state, "你好世界");
  assert.equal(state.complete, true);
  assert.equal(state.correct, 4);
});

test("中文输入法一次提交多个汉字时逐个匹配", () => {
  const state = applyText(createTypingState("学习中文。", "chinese"), "学习");
  assert.equal(state.index, 2);
  assert.equal(state.correct, 2);
  assert.equal(state.complete, false);
});

test("中文错误字符会阻塞直到退格清除", () => {
  let state = applyText(createTypingState("你好", "chinese"), "您");
  assert.equal(state.error, "您");
  assert.equal(state.errors, 1);
  state = applyKey(state, "Backspace");
  state = applyText(state, "你");
  assert.equal(state.index, 1);
});

test("中文统计只计算汉字", () => {
  assert.equal(countPracticeCharacters("你A好，世界！123", "chinese"), 4);
});
