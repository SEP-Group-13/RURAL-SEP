import type { Column } from '../../types/column'
import type { Filter } from '../../types/filter'
import type { ViewQuery } from '../../types/view'
import type { ApiFilter, ApiView, QueryParticipantsRequest } from '../apiTypes'
import { rewriteFormulaReferences } from './formula'
import { MappingError } from './MappingError'

/**
 * Translates between the frontend's stable column keys and the API's column names.
 *
 * The frontend identifies columns by `key` so renaming one never breaks filters, sorts or formulas.
 * The API identifies columns by their display name. This is the only place the two meet.
 *
 * - field, yearly, formula and simulation columns: name = the column's label
 * - band columns: name = "<source column name> band" (the spec names bands after their source),
 *   returned by the server once per year as "<source column name> band <year>"
 */
export class ColumnNames {
  private readonly columnsByKey: Map<string, Column>

  constructor(columns: Column[]) {
    this.columnsByKey = new Map(columns.map((column) => [column.key, column]))
  }

  /** API name for a frontend column key. */
  nameOf(key: string): string {
    const column = this.columnsByKey.get(key)
    if (column === undefined) {
      throw new MappingError(`Column [${key}] does not exist in this view.`)
    }
    if (column.source.kind === 'band') {
      return `${this.nameOf(column.source.sourceColumnKey)} band`
    }
    return column.label.trim()
  }

  /**
   * Frontend key (and year, for a per-year band column) for an API column name,
   * or null when the name belongs to no column of this view.
   */
  resolve(name: string): { key: string; year: number | null } | null {
    for (const column of this.columnsByKey.values()) {
      const ownName = this.nameOf(column.key)
      if (name === ownName) {
        return { key: column.key, year: null }
      }
      if (column.source.kind === 'band' && name.startsWith(`${ownName} `)) {
        const year = name.slice(ownName.length + 1)
        if (/^\d{4}$/.test(year)) {
          return { key: column.key, year: Number(year) }
        }
      }
    }
    return null
  }
}

/**
 * The `View` part of a request: which participants and which years, plus the definitions of the
 * view's formula, simulation and band columns. Used by the participant table and by the charts.
 */
export function toApiView(query: ViewQuery, names = new ColumnNames(query.columns)): ApiView {
  const view: ApiView = {}

  if (query.selectedYears !== 'all') {
    if (query.selectedYears.length === 0) {
      throw new MappingError('Select at least one year.')
    }
    view.years = [...new Set(query.selectedYears)]
  }

  const filters = query.filters.map((filter) => toApiFilter(filter, names)).filter((f) => f !== null)
  if (filters.length > 0) {
    view.filters = filters
  }

  // Definitions are sent for every column, also hidden ones: a visible formula can use a hidden one.
  const formulas = []
  const simulations = []
  const bands = []
  const bandedSources = new Set<string>()

  for (const column of query.columns) {
    const source = column.source
    if (source.kind === 'formula') {
      formulas.push({
        name: names.nameOf(column.key),
        expression: rewriteFormulaReferences(source.expression, (key) => names.nameOf(key)),
      })
    } else if (source.kind === 'simulation') {
      simulations.push({ name: names.nameOf(column.key), value: source.value })
    } else if (source.kind === 'band') {
      const sourceName = names.nameOf(source.sourceColumnKey)
      if (bandedSources.has(sourceName)) {
        throw new MappingError(`"${sourceName}" has two band columns. A column can have only one.`)
      }
      bandedSources.add(sourceName)
      bands.push({
        column: sourceName,
        bands: source.bands.map((band) =>
          band.below === null ? { label: band.label } : { label: band.label, upperBound: band.below },
        ),
      })
    }
  }

  if (formulas.length > 0) view.formulas = formulas
  if (simulations.length > 0) view.simulations = simulations
  if (bands.length > 0) view.bands = bands

  if (query.excludedIds.length > 0) {
    view.excludedParticipantIds = [...new Set(query.excludedIds)]
  }

  return view
}

export interface ParticipantQuery {
  body: QueryParticipantsRequest
  /** Needed to map the response back; see `fromParticipantPage`. */
  names: ColumnNames
}

/** The request for one page of the participant table. Only visible columns are requested. */
export function toQueryParticipantsRequest(query: ViewQuery, pageNumber: number, pageSize: number): ParticipantQuery {
  const names = new ColumnNames(query.columns)

  const columns = query.columns.filter((column) => column.visible).map((column) => names.nameOf(column.key))
  if (columns.length === 0) {
    throw new MappingError('Show at least one column.')
  }

  const body: QueryParticipantsRequest = {
    view: toApiView(query, names),
    columns,
    page: { page: pageNumber, pageSize },
  }
  if (query.sort !== null) {
    body.sort = { column: names.nameOf(query.sort.columnKey), direction: query.sort.direction }
  }

  return { body, names }
}

function toApiFilter(filter: Filter, names: ColumnNames): ApiFilter | null {
  const column = names.nameOf(filter.columnKey)

  switch (filter.operator) {
    case 'in':
      if (filter.value.length === 0) {
        throw new MappingError(`Select at least one value to filter "${column}" on, or remove the filter.`)
      }
      return { column, values: [...filter.value] }

    case 'between': {
      const { min, max } = filter.value
      if (min === null && max === null) {
        return null
      }
      if (min === null) return { column, max: max as number }
      if (max === null) return { column, min }
      return { column, min, max }
    }

    case 'startsWith':
      // Not in the spec yet (decided to handle later). Text search goes through /participants/search.
      return null
  }
}
