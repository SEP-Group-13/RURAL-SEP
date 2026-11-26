import type {
  ApiActivity,
  ApiColumn,
  ApiMeta,
  ApiParticipant,
  BurdenPreset,
  CountChartRequest,
  CountChartResponse,
  HistogramRequest,
  HistogramResponse,
  ParticipantBurden,
  ParticipantPage,
  ParticipantSearchResult,
  QueryParticipantsRequest,
} from '../data/api/apiTypes'
import { rewriteFormulaReferences } from '../data/api/mappers/formula'
import { PREDEFINED_FORMULAS } from '../data/columns/predefinedFormulas'
import { getPresetBands } from '../data/columns/presetBands'
import type { Band, PresetBandName } from '../data/types/band'
import type { Column } from '../data/types/column'
import type { ParticipantDetails, YearlyTotals } from '../data/types/participant'
import type { CellValue, ViewRow } from '../data/types/rows'
import type { ViewQuery } from '../data/types/view'
import { MOCK_DATABASE } from './data/mockDatabase'
import { buildAllParticipantDetails } from './data/mockServer'
import { invalid, MockProblem } from './mockProblem'
import { BASE_COLUMNS, DEFAULT_COLUMNS, isBandColumn, requireColumn, toMockView } from './mockView'
import { computeRow } from './pipeline/computeRow'
import { runPipeline } from './pipeline/runPipeline'

/**
 * A fake backend for development and tests: answers the spec's operations from the mock database,
 * using the spec's request and response types. It is not part of the production bundle.
 *
 * Columns are keyed by their API name (key = label), so the row computation moved from the browser
 * (mocks/pipeline) runs on name-based requests unchanged; formulas reference `[Column name]`.
 */

export { MockProblem }

const PARTICIPANTS: ParticipantDetails[] = buildAllParticipantDetails(MOCK_DATABASE)
const PARTICIPANTS_BY_ID = new Map(PARTICIPANTS.map((p) => [p.participantId, p]))
const REFRESHED_AT = new Date().toISOString()

const ALL_YEARS = [...new Set(PARTICIPANTS.flatMap((p) => p.yearlyTotals.map((t) => t.year)))].sort((a, b) => a - b)

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
    const view = toMockView(request.view, '/view', ALL_YEARS)

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
      const view = toMockView(apiView, `/views/${viewIndex}`, ALL_YEARS)
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
      const view = toMockView(apiView, `/views/${viewIndex}`, ALL_YEARS)
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
