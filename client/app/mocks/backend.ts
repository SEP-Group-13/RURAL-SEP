import type {
  ApiActivity,
  ApiColumn,
  ApiMeta,
  ApiParticipant,
  ApiView,
  BurdenPreset,
  CountChartRequest,
  CountChartResponse,
  HistogramRequest,
  HistogramResponse,
  ParticipantBurden,
  ParticipantPage,
  ParticipantSearchResult,
  Problem,
  QueryParticipantsRequest,
} from '../data/api/apiTypes'
import { rewriteFormulaReferences } from '../data/api/mappers/formula'
import { createDefaultColumns } from '../data/columns/defaultColumns'
import { PREDEFINED_FORMULAS } from '../data/columns/predefinedFormulas'
import { getPresetBands } from '../data/columns/presetBands'
import { validateBands } from '../data/pipeline/bands'
import { validateFormula } from '../data/pipeline/formula'
import type { Band, PresetBandName } from '../data/types/band'
import type { Column } from '../data/types/column'
import type { Filter } from '../data/types/filter'
import type { ParticipantDetails, YearlyTotals } from '../data/types/participant'
import type { CellValue, ViewRow } from '../data/types/rows'
import type { ViewQuery } from '../data/types/view'
import { MOCK_DATABASE } from './data/mockDatabase'
import { buildAllParticipantDetails } from './data/mockServer'
import { computeRow } from './pipeline/computeRow'
import { runPipeline } from './pipeline/runPipeline'

/**
 * A fake backend for development and tests: answers the spec's operations from the mock database,
 * using the spec's request and response types. It is not part of the production bundle.
 *
 * Columns are keyed by their API name (key = label), so the row computation moved from the browser
 * (mocks/pipeline) runs on name-based requests unchanged; formulas reference `[Column name]`.
 */

/** An error response with an `application/problem+json` body. */
export class MockProblem extends Error {
  status: number
  problem: Problem

  constructor(status: number, problem: Problem) {
    super(problem.detail ?? problem.title)
    this.status = status
    this.problem = problem
  }
}

const PARTICIPANTS: ParticipantDetails[] = buildAllParticipantDetails(MOCK_DATABASE)
const PARTICIPANTS_BY_ID = new Map(PARTICIPANTS.map((p) => [p.participantId, p]))
const REFRESHED_AT = new Date().toISOString()

const ALL_YEARS = [...new Set(PARTICIPANTS.flatMap((p) => p.yearlyTotals.map((t) => t.year)))].sort((a, b) => a - b)

/** The table's base columns (no bands: those are defined per view), keyed by API name. */
const DEFAULT_COLUMNS = createDefaultColumns()
const BASE_COLUMNS: Column[] = DEFAULT_COLUMNS.filter((c) => c.source.kind !== 'band').map((c) => ({
  ...c,
  key: c.label,
}))

const API_NAME_BY_KEY = new Map(DEFAULT_COLUMNS.map((c) => [c.key, c.label]))

export const mockBackend = {
  getMeta(): ApiMeta {
    return {
      dataSourceMode: 'internal',
      contactDetails: {
        name: PARTICIPANTS.some((p) => p.name !== null),
        email: PARTICIPANTS.some((p) => p.email !== null),
        phone: PARTICIPANTS.some((p) => p.phone !== null),
      },
      years: ALL_YEARS,
      dataRefreshedAt: REFRESHED_AT,
      unlinkedRecordCount: 0,
    }
  },

  listColumns(): ApiColumn[] {
    return BASE_COLUMNS.map((column) => {
      const original = DEFAULT_COLUMNS.find((c) => c.label === column.key)
      const apiColumn: ApiColumn = {
        name: column.key,
        type: column.dataType === 'number' ? 'numeric' : column.dataType === 'category' ? 'categorical' : 'text',
        isDefault: original?.visible ?? false,
      }
      if (column.dataType === 'category') {
        apiColumn.values = categoryValues(column)
      }
      return apiColumn
    })
  },

  getBurdenPresets(): BurdenPreset[] {
    const toName = (key: string) => API_NAME_BY_KEY.get(key) ?? key
    const preset = (name: string, formula: string | null, bands: PresetBandName, isDefault: boolean): BurdenPreset => ({
      name,
      formula: formula === null ? null : rewriteFormulaReferences(formula, toName),
      bands: toApiBands(getPresetBands(bands)),
      isDefault,
    })
    return [
      preset('Time burden (min)', null, 'time', true),
      preset('Radiation burden (mSv)', null, 'radiation', true),
      ...Object.values(PREDEFINED_FORMULAS).map((f) => preset(f.label, f.expression, f.presetBands, false)),
    ]
  },

  queryParticipants(request: QueryParticipantsRequest): ParticipantPage {
    const view = toMockView(request.view, '/view')

    request.columns.forEach((name, i) => requireColumn(view.query, name, `/columns/${i}`))
    if (request.sort !== undefined) {
      requireColumn(view.query, request.sort.column, '/sort/column')
      view.query.sort = { columnKey: request.sort.column, direction: request.sort.direction }
    }

    const rows = runPipeline(PARTICIPANTS, view.query)
    const page = request.page?.page ?? 1
    const pageSize = request.page?.pageSize ?? 25
    // Like a real server, a page past the last one is empty (no clamping).
    const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)

    const columns = request.columns.flatMap((name) =>
      isBandColumn(view.query, name) ? view.years.map((year) => `${name} ${year}`) : [name],
    )

    return {
      total: rows.length,
      page,
      pageSize,
      columns,
      rows: pageRows.map((row) => ({
        participantId: row.participantId,
        values: Object.fromEntries(
          request.columns.flatMap((name) =>
            isBandColumn(view.query, name)
              ? view.years.map((year) => [`${name} ${year}`, valueInYear(row.participantId, view.query, name, year)])
              : [[name, row.cells[name] ?? null]],
          ),
        ),
      })),
    }
  },

  searchParticipants(text: string, limit = 25): ParticipantSearchResult {
    const query = text.trim().toLowerCase()
    // TODO(spec): the spec doesn't say whether names, emails and phones match by prefix; prefix is assumed.
    const matches = PARTICIPANTS.filter((p) =>
      [p.participantId, p.name, p.email, p.phone].some((value) => value?.toLowerCase().startsWith(query)),
    )
    return {
      total: matches.length,
      participants: matches.slice(0, limit).map((p) => ({ participantId: p.participantId, name: p.name })),
    }
  },

  getParticipant(participantId: string): ApiParticipant {
    const p = findParticipant(participantId)
    return {
      participantId: p.participantId,
      age: p.age,
      sex: p.sex,
      race: p.race,
      county: p.county,
      state: p.state,
      studyStatus: p.studyStatus,
      name: p.name,
      email: p.email,
      phone: p.phone,
    }
  },

  getParticipantBurden(participantId: string): ParticipantBurden {
    const p = findParticipant(participantId)
    const perYear = p.yearlyTotals.map((totals) => ({
      year: totals.year,
      burden: toBurdenSummary(
        [totals],
        p.timeByExamElement.filter((element) => element.year === totals.year),
      ),
    }))
    return { cumulative: toBurdenSummary(p.yearlyTotals, p.timeByExamElement), perYear }
  },

  listParticipantActivities(participantId: string): ApiActivity[] {
    return findParticipant(participantId).activities.map((activity) => ({
      date: activity.startTime,
      examElement: activity.examElement,
      examType: activity.examType === 'core' ? 'core' : 'auxiliary',
      additionalStudy: activity.studyName,
      type: activity.activityId.startsWith('S') ? 'survey' : 'procedure',
      // TODO(spec): Activity.yaml attaches the status enum to `location` (see context/SPEC_ISSUES.md).
      // Remove this cast once the spec is fixed.
      location: activity.location as ApiActivity['location'],
      durationMinutes: activity.durationMinutes,
      radiationMsv: activity.radiationMsv,
      status: activity.status === 'completed' ? 'completed' : 'notCompleted',
    }))
  },

  queryChartCounts(request: CountChartRequest): CountChartResponse {
    const series = request.views.flatMap((apiView, viewIndex): CountChartResponse['series'] => {
      const view = toMockView(apiView, `/views/${viewIndex}`)
      const column = requireColumn(view.query, request.column, '/column')
      if (column.dataType !== 'category') {
        throw invalid('/column', `"${request.column}" has no fixed set of values, so it cannot be counted per value.`)
      }
      const rows = runPipeline(PARTICIPANTS, view.query)

      if (column.source.kind === 'band') {
        const labels = column.source.bands.map((band) => band.label)
        return view.years.map((year) => ({
          view: viewIndex,
          year,
          buckets: countValues(
            labels,
            rows.map((row) => valueInYear(row.participantId, view.query, request.column, year)),
          ),
        }))
      }
      return [
        {
          view: viewIndex,
          year: null,
          buckets: countValues(categoryValues(column), rows.map((row) => row.cells[request.column] ?? null)),
        },
      ]
    })
    return { series }
  },

  queryChartHistogram(request: HistogramRequest): HistogramResponse {
    const { binWidth } = request
    const series = request.views.map((apiView, viewIndex) => {
      const view = toMockView(apiView, `/views/${viewIndex}`)
      const column = requireColumn(view.query, request.column, '/column')
      if (column.dataType !== 'number') {
        throw invalid('/column', `"${request.column}" is not numeric, so it cannot be shown as a histogram.`)
      }
      const values = runPipeline(PARTICIPANTS, view.query)
        .map((row) => row.cells[request.column])
        .filter((value): value is number => typeof value === 'number')

      if (values.length === 0) {
        return { view: viewIndex, bins: [] }
      }
      const binOf = (value: number) => Math.floor(value / binWidth)
      const first = binOf(Math.min(...values))
      const last = binOf(Math.max(...values))
      const counts = new Map<number, number>()
      for (const value of values) {
        counts.set(binOf(value), (counts.get(binOf(value)) ?? 0) + 1)
      }
      const bins = []
      for (let bin = first; bin <= last; bin += 1) {
        bins.push({ lowerBound: bin * binWidth, count: counts.get(bin) ?? 0 })
      }
      return { view: viewIndex, bins }
    })
    return { series }
  },
}

/** The spec's Filter: CategoricalFilter or RangeFilter (with min, max or both). */
type SpecFilter = { column: string; values: string[] } | { column: string; min?: number; max?: number }

interface MockView {
  query: ViewQuery
  /** The selected years, or all years when the view selects none. */
  years: number[]
}

/** Turns the spec's View into the pipeline's ViewQuery, rejecting what the spec does not allow (422). */
function toMockView(view: ApiView, pointer: string): MockView {
  const columns: Column[] = [...BASE_COLUMNS]
  const addNamed = (column: Column, at: string) => {
    if (columns.some((c) => c.key.toLowerCase() === column.key.toLowerCase())) {
      throw invalid(at, `A column named "${column.key}" already exists.`)
    }
    columns.push(column)
  }

  view.simulations?.forEach((simulation, i) =>
    addNamed(
      {
        key: simulation.name,
        label: simulation.name,
        dataType: 'number',
        group: 'Simulations',
        visible: true,
        removable: true,
        source: { kind: 'simulation', value: simulation.value },
      },
      `${pointer}/simulations/${i}/name`,
    ),
  )
  view.formulas?.forEach((formula, i) =>
    addNamed(
      {
        key: formula.name,
        label: formula.name,
        dataType: 'number',
        group: 'Burden formulas',
        visible: true,
        removable: true,
        source: { kind: 'formula', expression: formula.expression },
      },
      `${pointer}/formulas/${i}/name`,
    ),
  )
  view.formulas?.forEach((formula, i) => {
    const error = validateFormula(formula.expression, columns, formula.name)
    if (error !== null) {
      throw invalid(`${pointer}/formulas/${i}/expression`, error)
    }
  })

  view.bands?.forEach((bandSet, i) => {
    const source = columns.find((c) => c.key === bandSet.column)
    if (source === undefined || source.dataType !== 'number') {
      throw invalid(`${pointer}/bands/${i}/column`, `"${bandSet.column}" is not a numeric column of this view.`)
    }
    const bands: Band[] = bandSet.bands.map((band) => ({ label: band.label, below: band.upperBound ?? null }))
    const error = validateBands(bands)
    if (error !== null) {
      throw invalid(`${pointer}/bands/${i}/bands`, error)
    }
    // TODO(spec): filtering and sorting on "<column> band" use the band of the total over the selected
    // years (the column's own value); the spec doesn't say yet. See context/SPEC_ISSUES.md.
    addNamed(
      {
        key: `${bandSet.column} band`,
        label: `${bandSet.column} band`,
        dataType: 'category',
        group: 'Bands',
        visible: true,
        removable: true,
        source: { kind: 'band', sourceColumnKey: bandSet.column, bands, presetName: null },
      },
      `${pointer}/bands/${i}/column`,
    )
  })

  // TODO(spec): the generated Filter type is `unknown` (see context/SPEC_ISSUES.md), so it is spelled out here.
  const apiFilters = (view.filters ?? []) as SpecFilter[]
  const filters: Filter[] = apiFilters.map((filter, i): Filter => {
    const at = `${pointer}/filters/${i}`
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
  })

  return {
    query: {
      columns,
      filters,
      sort: null,
      selectedYears: view.years ?? 'all',
      excludedIds: view.excludedParticipantIds ?? [],
    },
    years: view.years ? [...view.years].sort((a, b) => a - b) : ALL_YEARS,
  }
}

function requireColumn(query: ViewQuery, name: string, pointer: string): Column {
  const column = query.columns.find((c) => c.key === name)
  if (column === undefined) {
    throw invalid(pointer, `"${name}" is not a column of this view.`)
  }
  return column
}

function isBandColumn(query: ViewQuery, name: string): boolean {
  return query.columns.find((c) => c.key === name)?.source.kind === 'band'
}

/** A column's value for one participant, computed over a single calendar year. */
function valueInYear(participantId: string, query: ViewQuery, name: string, year: number): CellValue {
  const participant = PARTICIPANTS_BY_ID.get(participantId)
  if (participant === undefined) {
    return null
  }
  const row: ViewRow = computeRow(participant, { ...query, selectedYears: [year] })
  return row.cells[name] ?? null
}

function countValues(labels: string[], values: CellValue[]): { label: string; count: number }[] {
  return labels.map((label) => ({ label, count: values.filter((value) => value === label).length }))
}

function categoryValues(column: Column): string[] {
  if (column.source.kind !== 'field') {
    return []
  }
  const field = column.source.field
  const values = new Set<string>()
  for (const participant of PARTICIPANTS) {
    const value = participant[field]
    if (value !== null) {
      values.add(String(value))
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function toApiBands(bands: Band[]): BurdenPreset['bands'] {
  return bands.map((band) => (band.below === null ? { label: band.label } : { label: band.label, upperBound: band.below }))
}

/**
 * The spec's BurdenSummary, plus the activity counts that PR #100 adds to it.
 * TODO: type the counts through BurdenSummary once #100 is merged and the types are regenerated.
 */
function toBurdenSummary(totals: YearlyTotals[], elements: ParticipantDetails['timeByExamElement']) {
  const sum = (metric: Exclude<keyof YearlyTotals, 'year'>) => totals.reduce((total, t) => total + t[metric], 0)
  const minutesByElement = new Map<string, number>()
  for (const element of elements) {
    minutesByElement.set(element.examElement, (minutesByElement.get(element.examElement) ?? 0) + element.minutes)
  }
  const summary: ParticipantBurden['cumulative'] & Record<'emailsSent' | 'smsSent' | 'coreExamCompleted' | 'additionalStudies', number> = {
    timeMinutes: sum('timeMinutes'),
    timeByExamElement: [...minutesByElement].map(([examElement, timeMinutes]) => ({ examElement, timeMinutes })),
    radiationMsv: sum('radiationMsv'),
    contactFrequency: sum('emailsSent') + sum('smsSent'),
    participation: sum('coreExamCompleted') + sum('additionalStudies'),
    emailsSent: sum('emailsSent'),
    smsSent: sum('smsSent'),
    coreExamCompleted: sum('coreExamCompleted'),
    additionalStudies: sum('additionalStudies'),
  }
  return summary
}

function findParticipant(participantId: string): ParticipantDetails {
  const participant = PARTICIPANTS_BY_ID.get(participantId)
  if (participant === undefined) {
    throw new MockProblem(404, {
      type: 'urn:problem:participant-not-found',
      title: 'Participant not found',
      detail: `No participant with ID ${participantId} exists.`,
    })
  }
  return participant
}

function invalid(pointer: string, detail: string): MockProblem {
  return new MockProblem(422, {
    type: 'urn:problem:invalid-request',
    title: 'The request is invalid',
    detail,
    errors: [{ pointer, detail }],
  })
}
