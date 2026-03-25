#!/usr/bin/env bash
# 用法（在仓库根目录）：
#   ./scripts/untrack-ignored-in-index.sh
#   bash scripts/untrack-ignored-in-index.sh

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "错误：请在 Git 仓库内执行此脚本。" >&2
  exit 1
}

cd "$ROOT"

paths=()
while IFS= read -r -d '' f; do
  paths+=("$f")
done < <(git ls-files -z -ci --exclude-standard)

if [ "${#paths[@]}" -eq 0 ]; then
  echo "没有「已跟踪且匹配当前忽略规则」的路径，无需执行 git rm --cached。"
  exit 0
fi

echo "以下路径将从索引移除（本地文件保留）："
printf '  %s\n' "${paths[@]}"
echo ""
git rm -r --cached -- "${paths[@]}"
echo ""
echo "完成。请用 git status 确认后自行 git commit。"
