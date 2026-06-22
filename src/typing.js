function isEnglishLetter(character) {
  return /^[A-Za-z]$/.test(character ?? "");
}

function isChineseCharacter(character) {
  return /^[\u3400-\u9FFF]$/u.test(character ?? "");
}

function isPracticeCharacter(character, mode) {
  return mode === "chinese"
    ? isChineseCharacter(character)
    : isEnglishLetter(character);
}

function skipIgnoredCharacters(target, index, mode) {
  let nextIndex = index;
  while (nextIndex < target.length && !isPracticeCharacter(target[nextIndex], mode)) {
    nextIndex += 1;
  }
  return nextIndex;
}

export function createTypingState(target, mode = "english") {
  const normalizedTarget = String(target ?? "");
  const index = skipIgnoredCharacters(normalizedTarget, 0, mode);
  return {
    target: normalizedTarget,
    mode,
    index,
    correct: 0,
    error: "",
    errors: 0,
    complete: index === normalizedTarget.length
  };
}

export function applyKey(state, key) {
  if (state.complete) return state;

  if (state.error) {
    if (key === "Backspace") return { ...state, error: "" };
    return state;
  }

  if (key === "Backspace" || key.length !== 1) return state;
  return applyText(state, key);
}

function applyCharacter(state, character) {
  if (!isPracticeCharacter(character, state.mode)) return state;

  const expected = state.target[state.index];
  const matches = state.mode === "english"
    ? character.toLocaleLowerCase("en") === expected.toLocaleLowerCase("en")
    : character === expected;

  if (matches) {
    const index = skipIgnoredCharacters(state.target, state.index + 1, state.mode);
    return {
      ...state,
      index,
      correct: state.correct + 1,
      complete: index === state.target.length
    };
  }

  return { ...state, error: character, errors: state.errors + 1 };
}

export function applyText(state, text) {
  let nextState = state;
  for (const character of String(text ?? "")) {
    if (nextState.complete || nextState.error) break;
    nextState = applyCharacter(nextState, character);
  }
  return nextState;
}

export function countPracticeCharacters(text, mode = "english") {
  const pattern = mode === "chinese" ? /[\u3400-\u9FFF]/gu : /[A-Za-z]/g;
  return (String(text ?? "").match(pattern) ?? []).length;
}

export function accuracyFor(targetCharacters, errors) {
  if (targetCharacters <= 0) return errors > 0 ? 0 : 100;
  return Number(((targetCharacters / (targetCharacters + errors)) * 100).toFixed(1));
}
