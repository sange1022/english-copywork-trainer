import test from "node:test";
import assert from "node:assert/strict";
import { translationView } from "../public/translation-view.js";

test("翻译失败时显示重新翻译按钮", () => {
  assert.deepEqual(translationView({ text: "翻译暂不可用", available: false }), {
    text: "翻译暂不可用",
    retryVisible: true
  });
});

test("翻译成功时隐藏重新翻译按钮", () => {
  assert.deepEqual(translationView({ text: "学习需要时间。", available: true }), {
    text: "学习需要时间。",
    retryVisible: false
  });
});

test("重试过程中显示加载状态并隐藏按钮", () => {
  assert.deepEqual(translationView(null, { loading: true }), {
    text: "正在重新翻译…",
    retryVisible: false
  });
});
