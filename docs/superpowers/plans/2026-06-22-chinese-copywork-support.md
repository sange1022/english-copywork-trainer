# Chinese Copywork Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the published copywork page automatically support Chinese articles typed with a Chinese IME while preserving the existing English workflow.

**Architecture:** Add pure language-mode and character-matching helpers to the existing domain modules. The frontend chooses one mode for the whole article, hides English-only translation features in Chinese mode, and sends committed IME text to the same immutable typing state machine.

**Tech Stack:** Vanilla JavaScript ES modules, browser composition/input events, Node.js built-in test runner, GitHub Pages.

---

### Task 1: Detect mode and split Chinese text

**Files:**
- Modify: `src/text.js`
- Modify: `test/text.test.js`

- [ ] Add failing tests showing `detectPracticeMode("你好 world")` returns `"chinese"` and Chinese punctuation creates separate sentences.
- [ ] Run `node --test test/text.test.js` and verify the new tests fail.
- [ ] Implement `detectPracticeMode(text)` with `/[\u3400-\u9FFF]/u` and extend `splitSentences` to recognize `。！？`.
- [ ] Run the text tests and verify they pass.

### Task 2: Match committed Chinese characters

**Files:**
- Modify: `src/typing.js`
- Modify: `test/typing.test.js`

- [ ] Add failing tests for Chinese-only matching, automatic skipping of punctuation/Latin text, wrong-character blocking, and multi-character IME commits.
- [ ] Run `node --test test/typing.test.js` and verify the new tests fail.
- [ ] Change `createTypingState(target, mode)` to select English letters or CJK characters and add `applyText(state, text)` to feed committed characters one by one.
- [ ] Keep `applyKey` as the English single-key adapter and add `countPracticeCharacters(text, mode)` for statistics.
- [ ] Run the typing tests and verify they pass.

### Task 3: Wire Chinese IME behavior into the page

**Files:**
- Modify: `public/app.js`
- Modify: `public/index.html`
- Modify: `public/styles.css`
- Modify: `README.md`

- [ ] Store the detected mode in page state and pass it into the typing engine.
- [ ] In Chinese mode, hide the translation row and render the original sentence as plain text.
- [ ] Add an off-screen text input focused by the practice paper; process `input` only after composition is committed and clear its value afterward.
- [ ] Keep document keydown handling for English mode and Backspace error correction in both modes.
- [ ] Change hints and empty-input copy from “英文” to “中英文”.
- [ ] Document Chinese mode behavior.

### Task 4: Verify and publish

**Files:**
- Modify: `.github/workflows/pages.yml` only if the new static modules require deployment changes.

- [ ] Run `npm test` and `git diff --check`.
- [ ] In a real browser, verify Chinese input commits advance by hanzi, punctuation is skipped, errors block, and Chinese mode has no translation row.
- [ ] Verify the existing English translation and typing flow still works.
- [ ] Commit, push `main`, wait for the Pages workflow, and verify the public URL returns the updated application.
