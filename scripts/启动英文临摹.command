#!/bin/zsh
cd "$(dirname "$0")/.." || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，请先安装 Node.js 20 或更高版本。"
  read -k 1 "?按任意键关闭..."
  exit 1
fi

echo "正在启动英文打字临摹，请不要关闭这个窗口。"
npm start
