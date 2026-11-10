import type { Column, ColumnDataType } from '../types/column'
import type { Filter, FilterOperator } from '../types/filter'
import type { CellValue, ViewRow } from '../types/rows'

export function getFilterOperatorFor(dataType: ColumnDataType): FilterOperator {
  switch (dataType) {
    case 'number':
      return 'between'
    case 'category':
      return 'in'
    case 'text':
      return 'startsWith'
  }
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

export function validateFilter(filter: Filter, column: Column | undefined): string | null {
  if (column === undefined) {
    return `Column [${filter.columnKey}] does not exist in this view.`
  }

  const expectedOperator = getFilterOperatorFor(column.dataType)
  if (filter.operator !== expectedOperator) {
    return `Column "${column.label}" cannot be filtered with "${filter.operator}".`
  }

  if (filter.operator === 'between') {
    const { min, max } = filter.value
    if (min === null && max === null) {
      return 'Enter a minimum, a maximum or both.'
    }
    if ((min !== null && !Number.isFinite(min)) || (max !== null && !Number.isFinite(max))) {
      return 'The minimum and maximum must be numbers.'
    }
    if (min !== null && max !== null && min > max) {
      return `The minimum (${min}) is larger than the maximum (${max}).`
    }
  }

  if (filter.operator === 'startsWith' && filter.value.trim() === '') {
    return 'Enter the text to search for.'
  }

  return null
}
