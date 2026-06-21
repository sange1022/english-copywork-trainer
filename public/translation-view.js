export function translationView(result, { loading = false } = {}) {
  if (loading) {
    return { text: "正在重新翻译…", retryVisible: false };
  }
  if (!result?.available) {
    return {
      text: result?.text || "翻译暂不可用",
      retryVisible: true
    };
  }
  return { text: result.text, retryVisible: false };
}
