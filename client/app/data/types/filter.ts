export interface CategoryFilter {
  columnKey: string
  operator: 'in'
  value: string[]
}

export interface NumberRange {
  min: number | null
  max: number | null
}

export interface RangeFilter {
  columnKey: string
  operator: 'between'
  value: NumberRange
}

export interface TextFilter {
  columnKey: string
  operator: 'startsWith'
  value: string
}

export type Filter = CategoryFilter | RangeFilter | TextFilter

export type FilterOperator = Filter['operator']
