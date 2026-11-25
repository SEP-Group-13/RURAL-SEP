import type { Band } from '../../data/types/band'
import type { Filter } from '../../data/types/filter'
import type { CellValue, ViewRow } from '../../data/types/rows'

// Row computation for the mock backend (moved from data/pipeline/bands.ts and filters.ts).
// The browser app does not compute rows; it only validates input there.

export function findBandLabel(value: CellValue, bands: Band[]): string | null {
  if (typeof value !== 'number') {
    return null
  }
  for (const band of bands) {
    if (band.below === null || value < band.below) {
      return band.label
    }
  }
  return null
}

export function matchesAllFilters(row: ViewRow, filters: Filter[]): boolean {
  return filters.every((filter) => {
    const value = row.cells[filter.columnKey] ?? null
    return matchesFilter(value, filter)
  })
}

export function matchesFilter(value: CellValue, filter: Filter): boolean {
  if (value === null) {
    return false
  }

  switch (filter.operator) {
    case 'in':
      return filter.value.includes(String(value))

    case 'between': {
      if (typeof value !== 'number') {
        return false
      }
      const { min, max } = filter.value
      if (min !== null && value < min) {
        return false
      }
      if (max !== null && value > max) {
        return false
      }
      return true
    }

    case 'startsWith':
      return String(value).toLowerCase().startsWith(filter.value.trim().toLowerCase())
  }
}
