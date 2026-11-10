import type { CellValue, ViewRow } from '../types/rows'
import type { SortRule } from '../types/view'

export function sortRows(rows: ViewRow[], sort: SortRule | null): ViewRow[] {
  const copy = [...rows]
  if (sort === null) {
    return copy
  }

  const direction = sort.direction === 'asc' ? 1 : -1
  copy.sort((rowA, rowB) => {
    const a = rowA.cells[sort.columnKey] ?? null
    const b = rowB.cells[sort.columnKey] ?? null

    if (a === null && b === null) {
      return 0
    }
    if (a === null) {
      return 1
    }
    if (b === null) {
      return -1
    }
    return compareValues(a, b) * direction
  })
  return copy
}

function compareValues(a: Exclude<CellValue, null>, b: Exclude<CellValue, null>): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}
