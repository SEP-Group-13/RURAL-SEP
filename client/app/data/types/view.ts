import type { Column } from './column'
import type { Filter } from './filter'

export type YearSelection = 'all' | number[]

export type SortDirection = 'asc' | 'desc'

export interface SortRule {
  columnKey: string
  direction: SortDirection
}

export interface ViewQuery {
  columns: Column[]
  filters: Filter[]
  sort: SortRule | null
  selectedYears: YearSelection

  excludedIds: string[]
}

export interface ViewSettings extends ViewQuery {
  id: string
  name: string
}
