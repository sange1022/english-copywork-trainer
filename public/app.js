import { splitSentences, tokenizeWords } from "/modules/text.js";
import { accuracyFor, applyKey, createTypingState } from "/modules/typing.js";

const $ = (selector) => document.querySelector(selector);
const screens = {
  home: $("#home-screen"),
  practice: $("#practice-screen"),
  complete: $("#complete-screen")
};

const state = {
  sentences: [],
  translations: [],
  sentenceIndex: 0,
  typing: null,
  totalErrors: 0,
  startedAt: 0,
  sourceText: "",
  locked: false,
  timer: null
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle("hidden", key !== name);
  });
}

function totalCharacters() {
  return state.sentences.reduce((sum, sentence) => sum + sentence.length, 0);
}

function currentAccuracy() {
  const completed = state.sentences
    .slice(0, state.sentenceIndex)
    .reduce((sum, sentence) => sum + sentence.length, 0);
  const current = state.typing?.index ?? 0;
  return accuracyFor(completed + current, state.totalErrors);
}

function renderOriginal() {
  const container = $("#original-sentence");
  container.replaceChildren();
  for (const token of tokenizeWords(state.sentences[state.sentenceIndex])) {
    if (token.lookup) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-token";
      button.textContent = token.text;
      button.dataset.word = token.lookup;
      button.addEventListener("click", (event) => lookupWord(token.lookup, event.currentTarget));
      container.append(button);
    } else {
      container.append(document.createTextNode(token.text));
    }
  }
}

function renderCopyLine() {
  const line = $("#copy-line");
  line.replaceChildren();
  const characters = [...state.typing.target];

  characters.forEach((character, index) => {
    const span = document.createElement("span");
    span.textContent = character;
    if (index < state.typing.index) span.className = "copy-char--done";
    else if (index === state.typing.index && state.typing.error) {
      span.className = "copy-char--error";
      span.textContent = state.typing.error === " " ? "␠" : state.typing.error;
    } else if (index === state.typing.index) span.className = "copy-char--current";
    else span.className = "copy-char--pending";
    line.append(span);
  });
}

function renderSentence() {
  state.typing = createTypingState(state.sentences[state.sentenceIndex]);
  state.locked = false;
  $("#progress-label").textContent = `第 ${state.sentenceIndex + 1} / ${state.sentences.length} 句`;
  $("#accuracy-label").textContent = `正确率 ${currentAccuracy()}%`;
  $("#translation").textContent =
    state.translations[state.sentenceIndex]?.text ?? "翻译加载中…";
  $("#typing-hint").textContent = "直接用键盘输入淡色英文；输错后按退格修改";
  renderOriginal();
  renderCopyLine();
  $("#practice-paper").focus();
}

async function loadTranslations() {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sentences: state.sentences })
    });
    if (!response.ok) throw new Error();
    const body = await response.json();
    state.translations = body.translations;
  } catch {
    state.translations = state.sentences.map(() => ({
      text: "翻译暂不可用",
      available: false
    }));
  }
  if (!screens.practice.classList.contains("hidden")) {
    $("#translation").textContent = state.translations[state.sentenceIndex]?.text;
  }
}

function beginPractice({ reuseTranslations = false } = {}) {
  clearTimeout(state.timer);
  state.sentenceIndex = 0;
  state.totalErrors = 0;
  state.startedAt = Date.now();
  state.locked = false;
  if (!reuseTranslations) state.translations = [];
  showScreen("practice");
  renderSentence();
  if (!reuseTranslations) loadTranslations();
}

function startFromInput() {
  const source = $("#source-text").value.trim();
  $("#home-error").textContent = "";
  if (!source) {
    $("#home-error").textContent = "请先粘贴一些英文句子。";
    return;
  }
  state.sourceText = source;
  state.sentences = splitSentences(source);
  if (!state.sentences.length) {
    $("#home-error").textContent = "没有识别到可练习的句子。";
    return;
  }
  localStorage.setItem("copywork.draft.v1", source);
  beginPractice();
}

function finishPractice() {
  const seconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remaining = String(seconds % 60).padStart(2, "0");
  $("#final-sentences").textContent = state.sentences.length;
  $("#final-accuracy").textContent = `${accuracyFor(totalCharacters(), state.totalErrors)}%`;
  $("#final-time").textContent = `${minutes}:${remaining}`;
  showScreen("complete");
}

function handleKey(event) {
  if (screens.practice.classList.contains("hidden") || state.locked) return;
  if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
  if (event.key === "Escape") {
    closePopover();
    return;
  }
  if (event.key !== "Backspace" && event.key.length !== 1) return;

  event.preventDefault();
  const previousErrors = state.typing.errors;
  state.typing = applyKey(state.typing, event.key);
  state.totalErrors += state.typing.errors - previousErrors;
  renderCopyLine();
  $("#accuracy-label").textContent = `正确率 ${currentAccuracy()}%`;

  if (state.typing.complete) {
    state.locked = true;
    $("#typing-hint").textContent = "很好，准备下一句…";
    state.timer = setTimeout(() => {
      if (state.sentenceIndex < state.sentences.length - 1) {
        state.sentenceIndex += 1;
        renderSentence();
      } else {
        finishPractice();
      }
    }, 1000);
  }
}

async function lookupWord(word, anchor) {
  const popover = $("#word-popover");
  const rect = anchor.getBoundingClientRect();
  popover.style.left = `${Math.min(rect.left, window.innerWidth - 330)}px`;
  popover.style.top = `${rect.bottom + 10}px`;
  $("#popover-word").textContent = word;
  $("#popover-meaning").textContent = "查询中…";
  popover.classList.remove("hidden");

  try {
    const response = await fetch("/api/word", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ word })
    });
    if (!response.ok) throw new Error();
    const body = await response.json();
    $("#popover-meaning").textContent = body.meaning;
  } catch {
    $("#popover-meaning").textContent = "暂时查不到释义";
  }
}

function closePopover() {
  $("#word-popover").classList.add("hidden");
}

function returnHome() {
  clearTimeout(state.timer);
  closePopover();
  showScreen("home");
}

$("#start-button").addEventListener("click", startFromInput);
$("#exit-button").addEventListener("click", () => {
  if (confirm("退出本次练习吗？")) returnHome();
});
$("#repeat-button").addEventListener("click", () => beginPractice({ reuseTranslations: true }));
$("#home-button").addEventListener("click", returnHome);
$("#practice-paper").addEventListener("click", () => $("#practice-paper").focus());
$("#source-text").addEventListener("input", (event) => {
  $("#character-count").textContent = `${event.target.value.length} / 12000`;
});
document.addEventListener("keydown", handleKey);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".word-token") && !event.target.closest("#word-popover")) closePopover();
});

const savedDraft = localStorage.getItem("copywork.draft.v1") ?? "";
$("#source-text").value = savedDraft;
$("#character-count").textContent = `${savedDraft.length} / 12000`;
