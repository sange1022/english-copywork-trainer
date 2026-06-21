function isEnglishLetter(character) {
  return /^[A-Za-z]$/.test(character ?? "");
}

function skipNonLetters(target, index) {
  let nextIndex = index;
  while (nextIndex < target.length && !isEnglishLetter(target[nextIndex])) {
    nextIndex += 1;
  }
  return nextIndex;
}

export function createTypingState(target) {
  const normalizedTarget = String(target ?? "");
  const index = skipNonLetters(normalizedTarget, 0);
  return {
    target: normalizedTarget,
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

  if (key === "Backspace" || key.length !== 1 || !isEnglishLetter(key)) return state;

  const expected = state.target[state.index];
  if (key.toLocaleLowerCase("en") === expected.toLocaleLowerCase("en")) {
    const index = skipNonLetters(state.target, state.index + 1);
    return {
      ...state,
      index,
      correct: state.correct + 1,
      complete: index === state.target.length
    };
  }

  return { ...state, error: key, errors: state.errors + 1 };
}

export function countLetters(text) {
  return (String(text ?? "").match(/[A-Za-z]/g) ?? []).length;
}

export function accuracyFor(targetCharacters, errors) {
  if (targetCharacters <= 0) return errors > 0 ? 0 : 100;
  return Number(((targetCharacters / (targetCharacters + errors)) * 100).toFixed(1));
}
