#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

fail() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

required_paths=(
  "README.md"
  "AGENTS.md"
  "CLAUDE.md"
  "README.Docker.md"
  "docs/development-guide.md"
  "docs/frontend-development.md"
  "docs/documentation-task-board.md"
  "docs/requirements/shanghai-first-hospital-customization-requirements.md"
  "Dockerfile"
  "compose.yaml"
  "nginx.conf"
  "scripts/docker-build.sh"
  "scripts/docker-pre.sh"
)

for path in "${required_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    fail "required path missing: $path"
  fi
done

if find docs -name ".DS_Store" -print -quit | grep -q .; then
  fail "docs contains .DS_Store"
fi

markdown_files=()
while IFS= read -r file; do
  markdown_files+=("$file")
done < <(
  {
    printf '%s\n' README.md AGENTS.md CLAUDE.md README.Docker.md
    find docs -type f -name "*.md" -print
  } | sort -u
)

if rg -n "This template should help|Learn more about the recommended Project Setup|TODO|TBD" "${markdown_files[@]}"; then
  fail "template or placeholder text found in markdown files"
fi

board="docs/documentation-task-board.md"
board_required=(
  "README.md"
  "AGENTS.md"
  "CLAUDE.md"
  "README.Docker.md"
  "docs/development-guide.md"
  "docs/frontend-development.md"
  "docs/requirements/shanghai-first-hospital-customization-requirements.md"
)

for entry in "${board_required[@]}"; do
  if ! rg -Fq "$entry" "$board"; then
    fail "documentation task board missing entry: $entry"
  fi
done

check_markdown_links() {
  local file="$1"
  local base_dir
  base_dir="$(dirname "$file")"

  while IFS= read -r raw_link; do
    [[ -z "$raw_link" ]] && continue
    [[ "$raw_link" =~ ^https?:// ]] && continue
    [[ "$raw_link" =~ ^mailto: ]] && continue
    [[ "$raw_link" =~ ^# ]] && continue

    local link="${raw_link%%#*}"
    [[ -z "$link" ]] && continue

    local target
    if [[ "$link" = /* ]]; then
      target=".$link"
    else
      target="$base_dir/$link"
    fi

    if [[ ! -e "$target" ]]; then
      fail "$file references missing path: $raw_link"
    fi
  done < <(perl -ne 'while (/\]\(([^)]+)\)/g) { print "$1\n" }' "$file")
}

for file in "${markdown_files[@]}"; do
  check_markdown_links "$file"
done

if (( failures > 0 )); then
  echo "docs freshness check failed: $failures issue(s)" >&2
  exit 1
fi

echo "docs freshness check passed"
