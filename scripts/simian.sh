#!/usr/bin/env bash
# Runs Simian with the SEP assessment settings on the graded files.
# Builds the jar on first use into .simian/ (needs git and a JDK).
set -euo pipefail

SIMIAN_COMMIT="13850a7a3a0c3a2dedfa4c9b0de047275326aaed"
JAR="${SIMIAN_JAR:-.simian/simian.jar}"

if [ ! -f "$JAR" ]; then
  echo "Building Simian (first run only)..."
  src="$(mktemp -d)"
  git -C "$src" init -q
  git -C "$src" fetch -q --depth 1 https://github.com/quandarypeak/simian.git "$SIMIAN_COMMIT"
  git -C "$src" checkout -q FETCH_HEAD
  (cd "$src" && ./gradlew -q jar)
  mkdir -p "$(dirname "$JAR")"
  cp "$src"/build/libs/simian-*.jar "$JAR"
  rm -rf "$src"
fi

# Graded files: TS/TSX minus generated code, data and tests (same exclusions as ESLint).
# Includes untracked (not ignored) files so new code is checked before it is committed.
config="$(mktemp)"
report="$(mktemp)"
trap 'rm -f "$config" "$report"' EXIT
{
  printf '%s\n' \
    -balanceParentheses+ \
    -failOnDuplication+ \
    -ignoreCharacterCase+ \
    -ignoreCurlyBraces+ \
    -ignoreIdentifierCase+ \
    -ignoreModifiers+ \
    -ignoreStringCase+ \
    -language=typescript \
    -threshold=6
  git ls-files --cached --others --exclude-standard '*.ts' '*.tsx' \
    | grep -vE '^(shared/api/generated|api/openapi|csv_data|db|public)/|\.test\.tsx?$'
} > "$config"

java -jar "$JAR" -config="$config" -formatter=xml:"$report" > /dev/null || true
python3 "$(dirname "$0")/simian_metrics.py" "$report" "${SIMIAN_MAX_PERCENT:-3}"