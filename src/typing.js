export function createTypingState(target) {
  return {
    target: String(target ?? ""),
    index: 0,
    error: "",
    errors: 0,
    complete: target.length === 0
  };
}

export function applyKey(state, key) {
  if (state.complete) return state;

  if (state.error) {
    if (key === "Backspace") return { ...state, error: "" };
    return state;
  }

  if (key === "Backspace" || key.length !== 1) return state;

  const expected = state.target[state.index];
  if (key === expected) {
    const index = state.index + 1;
    return { ...state, index, complete: index === state.target.length };
  }

  return { ...state, error: key, errors: state.errors + 1 };
}

export function accuracyFor(targetCharacters, errors) {
  if (targetCharacters <= 0) return errors > 0 ? 0 : 100;
  return Number(((targetCharacters / (targetCharacters + errors)) * 100).toFixed(1));
}
