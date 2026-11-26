"""Splits a Simian XML report into the two SEP duplication metrics.

  internal: duplicated SLOC inside one module / total SLOC
  external: duplicated SLOC between modules   / total SLOC

Each duplicate set lists the blocks (file + line range) that share the same
lineCount significant lines. Per set:
  - blocks in a file that holds 2+ blocks of the set count as internal
  - if the set spans 2+ files, all its blocks count as external
A set can count toward both, as the assessment does ("they both are counted").
Line counts are Simian's significant lines, the same unit as the total.

Usage: python3 simian_metrics.py <report.xml> [max_percent]
Exits 1 if either percentage is above max_percent (default 3, the +2 rank).
"""

import os
import sys
import xml.etree.ElementTree as ET
from collections import Counter

# SEP assessment Table 4: upper bound of the % band -> rank
RANKS = [(3, "+2"), (5, "+1"), (10, "0"), (20, "-1"), (100, "-2")]


def rank(pct: float) -> str:
    return next(r for limit, r in RANKS if pct <= limit)


def main() -> int:
    report = sys.argv[1]
    max_pct = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0

    check = ET.parse(report).getroot().find("check")
    summary = check.find("summary")
    total = int(summary.get("totalSignificantLineCount"))
    files = int(summary.get("totalFileCount"))

    internal = external = 0
    sets = check.findall("set")
    for s in sets:
        lines = int(s.get("lineCount"))
        blocks = s.findall("block")
        per_file = Counter(b.get("sourceFile") for b in blocks)
        internal += lines * sum(n for n in per_file.values() if n > 1)
        if len(per_file) > 1:
            external += lines * len(blocks)

        print(f"{lines} duplicate lines in:")
        for b in blocks:
            path = os.path.relpath(b.get("sourceFile"))
            print(f"  {path}:{b.get('startLineNumber')}-{b.get('endLineNumber')}")

    def pct(n: int) -> float:
        return 100 * n / total if total else 0.0

    p_int, p_ext = pct(internal), pct(external)
    print(f"\n{len(sets)} duplicate sets, {files} files, {total} significant lines")
    print(f"Internal duplication: {internal}/{total} = {p_int:.1f}% (rank {rank(p_int)})")
    print(f"External duplication: {external}/{total} = {p_ext:.1f}% (rank {rank(p_ext)})")

    if p_int > max_pct or p_ext > max_pct:
        print(f"FAIL: duplication above {max_pct:g}%")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
