# English Copywork Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a double-clickable local web app that turns pasted English into sentence-by-sentence typing copywork with Chinese translations, strict character feedback, word lookup, progress statistics, and local history.

**Architecture:** A dependency-light Node.js HTTP server serves a vanilla HTML/CSS/JavaScript frontend and exposes local translation endpoints. Pure domain modules handle sentence splitting, typing state, and statistics so they can be developed test-first. Translation, caching, browser storage, and UI rendering remain behind focused interfaces so network failure never blocks practice.

**Tech Stack:** Node.js 24, built-in `node:test`, vanilla ES modules, HTML/CSS, MyMemory-compatible translation adapter, Playwright for end-to-end browser checks.

---

## File map

- `package.json` — scripts, project metadata, and Playwright development dependency.
- `src/server.js` — local-only HTTP server, static files, API routing, port fallback, and browser launch.
- `src/translation.js` — translation provider, timeout/retry behavior, and normalized results.
- `src/cache.js` — JSON-backed sentence and word translation cache.
- `src/text.js` — sentence splitting and word-token extraction.
- `src/typing.js` — strict copywork state transitions and accuracy calculation.
- `public/index.html` — semantic application shell.
- `public/styles.css` — responsive desktop-first visual system and feedback states.
- `public/app.js` — screen state, API calls, keyboard input, timers, storage, and rendering.
- `public/storage.js` — safe localStorage history and draft helpers.
- `scripts/启动英文临摹.command` — macOS double-click launcher.
- `test/text.test.js` — sentence and token parsing tests.
- `test/typing.test.js` — typing progression and statistics tests.
- `test/cache.test.js` — persistent cache tests.
- `test/translation.test.js` — provider success, retry, timeout, and fallback tests.
- `test/server.test.js` — local HTTP endpoint tests.
- `test/storage.test.js` — browser-storage helper tests with an in-memory storage object.
- `e2e/practice.spec.js` — complete browser practice flow.
- `playwright.config.js` — starts the local server and configures the browser test.
- `README.md` — Chinese setup, use, privacy, and troubleshooting instructions.

### Task 1: Project skeleton and test command

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `src/`
- Create: `public/`
- Create: `test/`
- Create: `e2e/`

- [ ] **Step 1: Add the package manifest**

```json
{
  "name": "english-copywork-trainer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test test/*.test.js",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.53.0"
  }
}
```

- [ ] **Step 2: Ignore generated state**

```gitignore
node_modules/
data/
test-results/
playwright-report/
.DS_Store
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and installation exits successfully.

- [ ] **Step 4: Verify the empty suite**

Run: `npm test`

Expected: command exits successfully with zero tests.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize copywork trainer"
```

### Task 2: Sentence splitting and clickable word tokens

**Files:**
- Create: `test/text.test.js`
- Create: `src/text.js`

- [ ] **Step 1: Write failing sentence-splitting tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { splitSentences, tokenizeWords } from "../src/text.js";

test("splits punctuation while retaining sentence endings", () => {
  assert.deepEqual(
    splitSentences('Hello world! "How are you?" I am fine'),
    ["Hello world!", '"How are you?"', "I am fine"]
  );
});

test("normalizes whitespace and protects common abbreviations", () => {
  assert.deepEqual(
    splitSentences("Dr. Smith is here.  He brought e.g. a notebook."),
    ["Dr. Smith is here.", "He brought e.g. a notebook."]
  );
});

test("returns clickable word and punctuation tokens", () => {
  assert.deepEqual(tokenizeWords("Hello, world!"), [
    { text: "Hello", lookup: "hello" },
    { text: ", ", lookup: null },
    { text: "world", lookup: "world" },
    { text: "!", lookup: null }
  ]);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/text.test.js`

Expected: FAIL because `src/text.js` does not exist.

- [ ] **Step 3: Implement the text helpers**

Implement:

```js
export function splitSentences(input) {
  // Normalize whitespace, temporarily protect Mr./Mrs./Ms./Dr./Prof./e.g./i.e.,
  // split after .!? plus closing quotes/brackets, restore abbreviations,
  // trim values, and remove empty strings.
}

export function tokenizeWords(sentence) {
  // Return contiguous Unicode-letter/apostrophe words as lookup tokens and
  // preserve every punctuation/spacing segment as a non-clickable token.
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/text.test.js`

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/text.js test/text.test.js
git commit -m "feat: parse copywork sentences and words"
```

### Task 3: Strict typing engine and statistics

**Files:**
- Create: `test/typing.test.js`
- Create: `src/typing.js`

- [ ] **Step 1: Write failing typing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createTypingState, applyKey, accuracyFor } from "../src/typing.js";

test("correct keys advance through the target", () => {
  let state = createTypingState("Hi!");
  state = applyKey(state, "H");
  state = applyKey(state, "i");
  state = applyKey(state, "!");
  assert.equal(state.index, 3);
  assert.equal(state.complete, true);
});

test("an error remains visible and blocks progress until backspace", () => {
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

test("accuracy counts wrong key presses without removing them on correction", () => {
  assert.equal(accuracyFor(100, 4), 96.2);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/typing.test.js`

Expected: FAIL because `src/typing.js` does not exist.

- [ ] **Step 3: Implement immutable typing transitions**

Implement exports:

```js
export function createTypingState(target) {
  return { target, index: 0, error: "", errors: 0, complete: false };
}

export function applyKey(state, key) {
  // Ignore modifier/navigation keys. While error is set, only Backspace clears
  // it. A correct key advances by one Unicode code point; a wrong printable key
  // records the visible error and increments errors.
}

export function accuracyFor(targetCharacters, errors) {
  // Return one-decimal percentage:
  // targetCharacters / (targetCharacters + errors) * 100.
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/typing.test.js`

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/typing.js test/typing.test.js
git commit -m "feat: add strict copywork typing engine"
```

### Task 4: Safe JSON translation cache

**Files:**
- Create: `test/cache.test.js`
- Create: `src/cache.js`

- [ ] **Step 1: Write failing cache tests**

Test a temporary file and assert:

```js
const cache = await createCache(file);
await cache.set("sentence:Hello", "你好");
assert.equal(await cache.get("sentence:Hello"), "你好");
```

Also write invalid JSON before `createCache(file)` and assert it starts empty instead of throwing.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/cache.test.js`

Expected: FAIL because `src/cache.js` does not exist.

- [ ] **Step 3: Implement cache creation**

Implement `createCache(filePath)` with async `get(key)` and `set(key, value)`. Create parent directories as needed, write the complete JSON object atomically through a temporary file, and treat missing or malformed cache files as empty.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/cache.test.js`

Expected: all cache tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/cache.js test/cache.test.js
git commit -m "feat: persist translation cache safely"
```

### Task 5: Translation adapter with graceful failure

**Files:**
- Create: `test/translation.test.js`
- Create: `src/translation.js`

- [ ] **Step 1: Write failing translation tests**

Inject `fetch` into `createTranslator`. Cover:

```js
const translator = createTranslator({
  fetchImpl: async () => ({
    ok: true,
    json: async () => ({ responseData: { translatedText: "你好" } })
  }),
  cache
});
assert.deepEqual(await translator.translateSentence("Hello"), {
  text: "你好",
  available: true
});
```

Also verify one transient failure is retried, cached values avoid `fetch`, and exhausted failures return `{ text: "翻译暂不可用", available: false }` rather than throwing.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/translation.test.js`

Expected: FAIL because `src/translation.js` does not exist.

- [ ] **Step 3: Implement the provider**

Implement `createTranslator({ fetchImpl, cache, timeoutMs = 6000, retries = 1 })`. Use an encoded MyMemory-compatible request for `en|zh-CN`, normalize HTML entities, and expose:

```js
translateSentence(sentence)
lookupWord(word)
```

Use distinct cache keys. `lookupWord` returns `{ word, meaning, available }`; both methods return stable fallback objects on timeout, invalid response, rate limit, or network failure.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/translation.test.js`

Expected: all translation tests pass without making real network calls.

- [ ] **Step 5: Commit**

```bash
git add src/translation.js test/translation.test.js
git commit -m "feat: add resilient free translation adapter"
```

### Task 6: Local-only HTTP server

**Files:**
- Create: `test/server.test.js`
- Create: `src/server.js`

- [ ] **Step 1: Write failing server tests**

Start the exported `createServer()` on port `0` with a fake translator. Assert:

- `GET /health` returns `{ ok: true }`.
- `POST /api/translate` with `{ sentences: ["Hello"] }` returns translated objects.
- `POST /api/word` with `{ word: "hello" }` returns a meaning.
- empty and over-12,000-character requests return status `400`.
- `GET /` returns the application HTML.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/server.test.js`

Expected: FAIL because `src/server.js` does not exist.

- [ ] **Step 3: Implement the server**

Implement:

```js
export function createServer({ translator, publicDir } = {}) {}
export async function startServer({ preferredPort = 4318, openBrowser = true } = {}) {}
```

Requirements:

- bind only to `127.0.0.1`;
- serve known files from `public/` with explicit MIME types and no path traversal;
- limit JSON bodies to 64 KB;
- validate sentence arrays, word strings, and the 12,000-character article limit;
- translate sentences with bounded concurrency of four;
- return JSON error messages in Chinese;
- try sequential ports through `preferredPort + 10`;
- open the final URL with macOS `open` only when `openBrowser` is true;
- start automatically only when run as the main module.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/server.test.js`

Expected: all server tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/server.js test/server.test.js
git commit -m "feat: serve local copywork and translation APIs"
```

### Task 7: Local history and draft storage

**Files:**
- Create: `test/storage.test.js`
- Create: `public/storage.js`

- [ ] **Step 1: Write failing storage tests**

With an in-memory object implementing `getItem` and `setItem`, assert that:

- malformed JSON returns an empty history;
- saving a result puts the newest entry first;
- only the newest 30 results are retained;
- draft text round-trips.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/storage.test.js`

Expected: FAIL because `public/storage.js` does not exist.

- [ ] **Step 3: Implement storage helpers**

Export:

```js
loadHistory(storage)
saveHistoryEntry(storage, entry)
loadDraft(storage)
saveDraft(storage, text)
```

Use versioned keys `copywork.history.v1` and `copywork.draft.v1`; catch quota and malformed-data errors without breaking the application.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/storage.test.js`

Expected: all storage tests pass.

- [ ] **Step 5: Commit**

```bash
git add public/storage.js test/storage.test.js
git commit -m "feat: save local copywork history"
```

### Task 8: Application shell and visual design

**Files:**
- Create: `public/index.html`
- Create: `public/styles.css`

- [ ] **Step 1: Create the semantic shell**

Include three route-like sections with stable IDs:

- `home-screen`: title, explanatory text, article textarea, character counter, start button, error region, recent history;
- `practice-screen`: progress header, original sentence, translation, copy line, hidden keyboard-capture input, exit button, word popover;
- `complete-screen`: summary statistics, repeat button, home button.

Load `app.js` as an ES module and give all controls accessible labels.

- [ ] **Step 2: Style the copybook experience**

Create a calm paper-like desktop layout with warm off-white background, ink blue text, generous line height, and a subtle ruled-paper practice surface. Define visible states:

```css
.copy-char--done {}
.copy-char--current {}
.copy-char--pending {}
.copy-char--error {}
.word-token {}
.word-popover {}
```

Ensure keyboard focus is obvious, red feedback does not rely only on color, and widths remain usable from 768 px upward.

- [ ] **Step 3: Run static server smoke check**

Run: `node src/server.js`

Expected: server prints a `http://127.0.0.1:<port>` URL and `/` renders without missing static assets.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/styles.css
git commit -m "feat: add copybook application interface"
```

### Task 9: Frontend practice flow

**Files:**
- Create: `public/app.js`
- Modify: `public/index.html`
- Modify: `public/styles.css`

- [ ] **Step 1: Add pure frontend state helpers**

Import `splitSentences`, `tokenizeWords`, `createTypingState`, `applyKey`, and `accuracyFor` through browser-served `/modules/*.js` paths exposed by the server. Define a single state object containing:

```js
{
  screen,
  sourceText,
  sentences,
  translations,
  sentenceIndex,
  typing,
  totalErrors,
  startedAt,
  finishedAt,
  transitionTimer
}
```

- [ ] **Step 2: Implement start and translation loading**

On start:

- validate non-empty text and at most 12,000 characters;
- split text and reject zero sentences;
- switch to the practice screen immediately;
- request `/api/translate`;
- render each translation when available and show `翻译暂不可用` on failure;
- prevent duplicate start submissions.

- [ ] **Step 3: Implement strict keyboard capture**

Focus the hidden capture input whenever the practice surface is clicked. Prevent paste in the practice area. Pass printable keys and Backspace to `applyKey`, render completed/current/pending/error characters, count errors, and ignore shortcuts and IME composition until `compositionend`.

- [ ] **Step 4: Implement sentence progression**

When a sentence completes:

- lock keyboard input;
- show a completion pulse;
- wait 1,000 ms;
- move to the next sentence and focus capture;
- on the last sentence, calculate summary statistics, save history, and show the completion screen.

Always clear `transitionTimer` when exiting or restarting.

- [ ] **Step 5: Implement clickable word lookup**

Render original text with `tokenizeWords`. Clicking a lookup token opens a positioned popover with loading state, requests `/api/word`, displays the Chinese meaning, and supports retry. Clicking outside or pressing Escape closes it.

- [ ] **Step 6: Implement exit, repeat, history, and draft behavior**

- confirm before exiting an active unfinished session;
- repeat with the current sentences and translations without another translation call;
- restore draft text on load and save it after changes;
- render the newest 30 history entries with date, accuracy, sentence count, and duration.

- [ ] **Step 7: Run the unit suite**

Run: `npm test`

Expected: all unit tests pass with no warnings.

- [ ] **Step 8: Commit**

```bash
git add public/app.js public/index.html public/styles.css src/server.js
git commit -m "feat: complete interactive copywork practice"
```

### Task 10: Browser end-to-end proof

**Files:**
- Create: `playwright.config.js`
- Create: `e2e/practice.spec.js`

- [ ] **Step 1: Write the failing browser test**

Configure Playwright to start `node src/server.js` with `COPYWORK_FAKE_TRANSLATION=1`. Test:

1. paste `Hello world! I am learning.`;
2. click “开始练习”;
3. verify English and Chinese rows appear;
4. type a wrong first key and assert the red error state;
5. press Backspace and type the exact sentence;
6. wait for automatic movement to sentence two;
7. click `learning` and verify a meaning popover;
8. finish the second sentence;
9. verify the completion statistics screen.

- [ ] **Step 2: Run and verify RED**

Run: `npx playwright install chromium && npm run test:e2e`

Expected: test initially fails at the first missing or incorrect interaction.

- [ ] **Step 3: Add deterministic fake translation mode**

When `COPYWORK_FAKE_TRANSLATION=1`, have `startServer` inject a fixed translator only for local tests. Do not expose this toggle in the UI.

- [ ] **Step 4: Fix UI details until GREEN**

Run: `npm run test:e2e`

Expected: the full practice flow passes in Chromium.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.js e2e/practice.spec.js src/server.js public/
git commit -m "test: cover complete copywork browser flow"
```

### Task 11: Double-click launcher and user documentation

**Files:**
- Create: `scripts/启动英文临摹.command`
- Create: `README.md`

- [ ] **Step 1: Add the launcher**

The executable shell script must:

```bash
#!/bin/zsh
set -e
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，请先安装 Node.js 20 或更高版本。"
  read -k 1 "?按任意键关闭..."
  exit 1
fi
if [ ! -d node_modules ]; then
  npm install
fi
npm start
```

Run: `chmod +x scripts/启动英文临摹.command`

- [ ] **Step 2: Write Chinese documentation**

Document:

- double-click and terminal launch methods;
- Node.js 20+ prerequisite;
- paste → start → strict typing → completion flow;
- translations require internet and may occasionally be unavailable;
- practice/history remains local;
- how to stop the local server;
- troubleshooting for macOS Gatekeeper using right-click → Open.

- [ ] **Step 3: Run final verification**

Run:

```bash
npm test
npm run test:e2e
git diff --check
```

Expected: all tests pass and `git diff --check` prints no errors.

- [ ] **Step 4: Manually launch**

Run: `scripts/启动英文临摹.command`

Expected: browser opens on a local loopback URL, a short two-sentence practice can be completed, and stopping the terminal ends the service.

- [ ] **Step 5: Commit**

```bash
git add scripts/启动英文临摹.command README.md
git commit -m "docs: add launcher and usage guide"
```

### Task 12: Final review

**Files:**
- Review all files from Tasks 1–11.

- [ ] **Step 1: Verify spec coverage**

Confirm the app includes automatic punctuation-based splitting, automatic Chinese sentence translation, strict case/space/punctuation matching, visible red errors, Backspace correction, one-second sentence transitions, clickable word meanings, results, local history, translation degradation, 12,000-character validation, and macOS double-click launch.

- [ ] **Step 2: Run all checks from a clean process**

Run:

```bash
npm test
npm run test:e2e
git status --short
```

Expected: all tests pass; only intentional files are shown.

- [ ] **Step 3: Review runtime security**

Confirm the server binds only to `127.0.0.1`, rejects traversal and oversized bodies, does not log pasted articles, and stores no credentials.

- [ ] **Step 4: Prepare handoff**

Provide the absolute launcher path, test totals, any limitations of the current free translation provider, and the simplest first-run instructions.
