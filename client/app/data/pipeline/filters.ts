import type { Column, ColumnDataType } from '../types/column'
import type { Filter, FilterOperator } from '../types/filter'

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
