import test from "node:test";
import assert from "node:assert/strict";
import { accuracyFor, applyKey, createTypingState } from "../src/typing.js";

test("正确字符逐个推进直到完成", () => {
  let state = createTypingState("Hi!");
  state = applyKey(state, "H");
  state = applyKey(state, "i");
  state = applyKey(state, "!");
  assert.equal(state.index, 3);
  assert.equal(state.complete, true);
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
