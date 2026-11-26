#!/usr/bin/env bash
# Runs Simian with the SEP assessment settings on the graded files.
# Builds the jar on first use into .simian/ (needs git and a JDK).
#
# Usage: scripts/simian.sh [file...]
#   With files given, scans those instead of the default graded list.
#   With SIMIAN_REPORT=<path> set, only writes the XML report there (no summary, no pass/fail);
#   scripts/quality_report.py uses this to scan the same files Understand analyses.
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
report="${SIMIAN_REPORT:-$(mktemp)}"
trap 'rm -f "$config"; [ -n "${SIMIAN_REPORT:-}" ] || rm -f "$report"' EXIT
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
  if [ "$#" -gt 0 ]; then
    printf '%s\n' "$@"
  else
    git ls-files --cached --others --exclude-standard '*.ts' '*.tsx' \
      | grep -vE '^(shared/api/generated|api/openapi|csv_data|db|public)/|\.test\.tsx?$'
  fi
} > "$config"

java -jar "$JAR" -config="$config" -formatter=xml:"$report" > /dev/null || true
[ -z "${SIMIAN_REPORT:-}" ] || exit 0
python3 "$(dirname "$0")/simian_metrics.py" "$report" "${SIMIAN_MAX_PERCENT:-3}"