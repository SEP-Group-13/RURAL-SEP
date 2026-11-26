import type { ApiView } from '../data/api/apiTypes'
import { createDefaultColumns } from '../data/columns/defaultColumns'
import { validateBands } from '../data/pipeline/bands'
import { validateFormula } from '../data/pipeline/formula'
import type { Band } from '../data/types/band'
import type { Column } from '../data/types/column'
import type { Filter } from '../data/types/filter'
import type { ViewQuery } from '../data/types/view'
import { invalid } from './mockProblem'

/** The spec's Filter: CategoricalFilter or RangeFilter (with min, max or both). */
type SpecFilter = { column: string; values: string[] } | { column: string; min?: number; max?: number }

type BandSet = NonNullable<ApiView['bands']>[number]

export interface MockView {
  query: ViewQuery
  /** The selected years, or all years when the view selects none. */
  years: number[]
}

/** The table's base columns (no bands: those are defined per view), keyed by API name. */
export const DEFAULT_COLUMNS = createDefaultColumns()
export const BASE_COLUMNS: Column[] = DEFAULT_COLUMNS.filter((c) => c.source.kind !== 'band').map((c) => ({
  ...c,
  key: c.label,
}))

/** Turns the spec's View into the pipeline's ViewQuery, rejecting what the spec does not allow (422). */
export function toMockView(view: ApiView, pointer: string, allYears: number[]): MockView {
  const columns = buildViewColumns(view, pointer)
  // TODO(spec): the generated Filter type is `unknown` (see context/SPEC_ISSUES.md), so it is spelled out here.
  const apiFilters = (view.filters ?? []) as SpecFilter[]
  const filters = apiFilters.map((filter, i) => toFilter(filter, columns, `${pointer}/filters/${i}`))

  return {
    query: {
      columns,
      filters,
      sort: null,
      selectedYears: view.years ?? 'all',
      excludedIds: view.excludedParticipantIds ?? [],
    },
    years: view.years ? [...view.years].sort((a, b) => a - b) : allYears,
  }
}

/** The base columns plus the view's simulations, formulas and band columns, in that order. */
function buildViewColumns(view: ApiView, pointer: string): Column[] {
  const columns: Column[] = [...BASE_COLUMNS]
  const addNamed = (column: Column, at: string) => {
    if (columns.some((c) => c.key.toLowerCase() === column.key.toLowerCase())) {
      throw invalid(at, `A column named "${column.key}" already exists.`)
    }
    columns.push(column)
  }

  view.simulations?.forEach((simulation, i) =>
    addNamed(
      numberColumn(simulation.name, 'Simulations', { kind: 'simulation', value: simulation.value }),
      `${pointer}/simulations/${i}/name`,
    ),
  )
  view.formulas?.forEach((formula, i) =>
    addNamed(
      numberColumn(formula.name, 'Burden formulas', { kind: 'formula', expression: formula.expression }),
      `${pointer}/formulas/${i}/name`,
    ),
  )
  view.formulas?.forEach((formula, i) => {
    const error = validateFormula(formula.expression, columns, formula.name)
    if (error !== null) {
      throw invalid(`${pointer}/formulas/${i}/expression`, error)
    }
  })
  view.bands?.forEach((bandSet, i) =>
    addNamed(toBandColumn(bandSet, columns, `${pointer}/bands/${i}`), `${pointer}/bands/${i}/column`),
  )
  return columns
}

function numberColumn(name: string, group: Column['group'], source: Column['source']): Column {
  return { key: name, label: name, dataType: 'number', group, visible: true, removable: true, source }
}

function toBandColumn(bandSet: BandSet, columns: Column[], at: string): Column {
  const source = columns.find((c) => c.key === bandSet.column)
  if (source === undefined || source.dataType !== 'number') {
    throw invalid(`${at}/column`, `"${bandSet.column}" is not a numeric column of this view.`)
  }
  const bands: Band[] = bandSet.bands.map((band) => ({ label: band.label, below: band.upperBound ?? null }))
  const error = validateBands(bands)
  if (error !== null) {
    throw invalid(`${at}/bands`, error)
  }
  // TODO(spec): filtering and sorting on "<column> band" use the band of the total over the selected
  // years (the column's own value); the spec doesn't say yet. See context/SPEC_ISSUES.md.
  return {
    key: `${bandSet.column} band`,
    label: `${bandSet.column} band`,
    dataType: 'category',
    group: 'Bands',
    visible: true,
    removable: true,
    source: { kind: 'band', sourceColumnKey: bandSet.column, bands, presetName: null },
  }
}

function toFilter(filter: SpecFilter, columns: Column[], at: string): Filter {
  const column = columns.find((c) => c.key === filter.column)
  if (column === undefined) {
    throw invalid(`${at}/column`, `"${filter.column}" is not a column of this view.`)
  }
  if ('values' in filter) {
    if (column.dataType !== 'category') {
      throw invalid(`${at}/column`, `"${filter.column}" has no fixed set of values to filter on.`)
    }
    return { columnKey: filter.column, operator: 'in', value: filter.values }
  }
  if (column.dataType !== 'number') {
    throw invalid(`${at}/column`, `"${filter.column}" is not numeric, so it cannot be filtered on a range.`)
  }
  const min = filter.min ?? null
  const max = filter.max ?? null
  if (min !== null && max !== null && min > max) {
    throw invalid(`${at}/min`, `The minimum (${min}) is larger than the maximum (${max}).`)
  }
  return { columnKey: filter.column, operator: 'between', value: { min, max } }
}

export function requireColumn(query: ViewQuery, name: string, pointer: string): Column {
  const column = query.columns.find((c) => c.key === name)
  if (column === undefined) {
    throw invalid(pointer, `"${name}" is not a column of this view.`)
  }
  return column
}

export function isBandColumn(query: ViewQuery, name: string): boolean {
  return query.columns.find((c) => c.key === name)?.source.kind === 'band'
}
