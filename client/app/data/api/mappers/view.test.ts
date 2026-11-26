import { describe, expect, it } from 'vitest'
import { createDefaultColumns } from '../../columns/defaultColumns'
import { getPresetBands } from '../../columns/presetBands'
import type { Column } from '../../types/column'
import type { ViewQuery } from '../../types/view'
import { MappingError } from './MappingError'
import { ColumnNames, toApiView, toQueryParticipantsRequest } from './view'

function defaultQuery(changes: Partial<ViewQuery> = {}): ViewQuery {
  return { columns: createDefaultColumns(), filters: [], sort: null, selectedYears: 'all', excludedIds: [], ...changes }
}

function hide(columns: Column[], ...keys: string[]): Column[] {
  return columns.map((column) => (keys.includes(column.key) ? { ...column, visible: false } : column))
}

const TIME_BANDS = [
  { label: 'Low', upperBound: 180 },
  { label: 'Medium', upperBound: 360 },
  { label: 'High' },
]
const RADIATION_BANDS = [
  { label: 'Low', upperBound: 3 },
  { label: 'Medium', upperBound: 10 },
  { label: 'High' },
]

/** The "Bone scan study" demo view (views/demoViews.ts). */
function boneScanQuery(simulationLabel = 'Bone scan (mSv)'): ViewQuery {
  const columns: Column[] = [
    ...hide(createDefaultColumns(), 'timeBurden', 'timeBand'),
    {
      key: 'simulation1',
      label: simulationLabel,
      dataType: 'number',
      group: 'Simulations',
      visible: true,
      removable: true,
      source: { kind: 'simulation', value: 5 },
    },
    {
      key: 'formula1',
      label: 'Radiation after scan (mSv)',
      dataType: 'number',
      group: 'Burden formulas',
      visible: true,
      removable: true,
      source: { kind: 'formula', expression: '[radiationBurden] + [simulation1]' },
    },
    {
      key: 'formula1Band',
      label: 'Radiation after scan (mSv) band',
      dataType: 'category',
      group: 'Bands',
      visible: true,
      removable: true,
      source: { kind: 'band', sourceColumnKey: 'formula1', bands: getPresetBands('radiation'), presetName: 'radiation' },
    },
  ]
  return defaultQuery({ columns, sort: { columnKey: 'formula1', direction: 'desc' } })
}

describe('toQueryParticipantsRequest', () => {
  it('maps the default view', () => {
    const { body } = toQueryParticipantsRequest(defaultQuery(), 1, 10)

    expect(body).toEqual({
      view: {
        bands: [
          { column: 'Time burden (min)', bands: TIME_BANDS },
          { column: 'Radiation burden (mSv)', bands: RADIATION_BANDS },
        ],
      },
      columns: [
        'Participant ID',
        'Age',
        'Sex',
        'Race',
        'County',
        'State',
        'Study status',
        'Time burden (min)',
        'Time burden (min) band',
        'Radiation burden (mSv)',
        'Radiation burden (mSv) band',
      ],
      page: { page: 1, pageSize: 10 },
    })
  })

  it('maps filters and sort ("Women 40+")', () => {
    const query = defaultQuery({
      filters: [
        { columnKey: 'sex', operator: 'in', value: ['Female'] },
        { columnKey: 'age', operator: 'between', value: { min: 40, max: null } },
      ],
      sort: { columnKey: 'age', direction: 'asc' },
    })
    const { body } = toQueryParticipantsRequest(query, 2, 10)

    expect(body.view.filters).toEqual([
      { column: 'Sex', values: ['Female'] },
      { column: 'Age', min: 40 },
    ])
    expect(body.sort).toEqual({ column: 'Age', direction: 'asc' })
    expect(body.page).toEqual({ page: 2, pageSize: 10 })
  })

  it('maps formulas, simulations and bands, also for hidden columns ("Bone scan study")', () => {
    const { body } = toQueryParticipantsRequest(boneScanQuery(), 1, 10)

    expect(body.view.simulations).toEqual([{ name: 'Bone scan (mSv)', value: 5 }])
    expect(body.view.formulas).toEqual([
      { name: 'Radiation after scan (mSv)', expression: '[Radiation burden (mSv)] + [Bone scan (mSv)]' },
    ])
    expect(body.view.bands).toEqual([
      { column: 'Time burden (min)', bands: TIME_BANDS },
      { column: 'Radiation burden (mSv)', bands: RADIATION_BANDS },
      { column: 'Radiation after scan (mSv)', bands: RADIATION_BANDS },
    ])
    expect(body.columns).not.toContain('Time burden (min)')
    expect(body.columns).toContain('Radiation after scan (mSv) band')
    expect(body.sort).toEqual({ column: 'Radiation after scan (mSv)', direction: 'desc' })
  })

  it('follows a renamed column into the formulas that use it', () => {
    const { body } = toQueryParticipantsRequest(boneScanQuery('Scan dose'), 1, 10)

    expect(body.view.formulas?.[0]?.expression).toBe('[Radiation burden (mSv)] + [Scan dose]')
  })

  it('rejects a view without visible columns', () => {
    const query = defaultQuery({ columns: createDefaultColumns().map((column) => ({ ...column, visible: false })) })
    expect(() => toQueryParticipantsRequest(query, 1, 10)).toThrow(MappingError)
  })
})

describe('toApiView', () => {
  it('leaves out years when all are selected, and lists them otherwise', () => {
    expect(toApiView(defaultQuery()).years).toBeUndefined()
    expect(toApiView(defaultQuery({ selectedYears: [2025, 2025, 2024] })).years).toEqual([2025, 2024])
  })

  it('rejects an empty year selection', () => {
    expect(() => toApiView(defaultQuery({ selectedYears: [] }))).toThrow(MappingError)
  })

  it('maps excluded participants', () => {
    expect(toApiView(defaultQuery()).excludedParticipantIds).toBeUndefined()
    expect(toApiView(defaultQuery({ excludedIds: ['P1', 'P2', 'P1'] })).excludedParticipantIds).toEqual(['P1', 'P2'])
  })

  it('maps range filters with one or two ends', () => {
    const view = toApiView(
      defaultQuery({
        filters: [
          { columnKey: 'age', operator: 'between', value: { min: null, max: 65 } },
          { columnKey: 'radiationBurden', operator: 'between', value: { min: 1, max: 5 } },
        ],
      }),
    )
    expect(view.filters).toEqual([
      { column: 'Age', max: 65 },
      { column: 'Radiation burden (mSv)', min: 1, max: 5 },
    ])
  })

  it('maps a filter on a band column to the band name', () => {
    const view = toApiView(defaultQuery({ filters: [{ columnKey: 'timeBand', operator: 'in', value: ['High'] }] }))
    expect(view.filters).toEqual([{ column: 'Time burden (min) band', values: ['High'] }])
  })

  it('skips text filters, which the spec does not support yet', () => {
    const view = toApiView(defaultQuery({ filters: [{ columnKey: 'participantId', operator: 'startsWith', value: 'P1' }] }))
    expect(view.filters).toBeUndefined()
  })

  it('rejects an empty category filter, which the spec does not allow', () => {
    const query = defaultQuery({ filters: [{ columnKey: 'sex', operator: 'in', value: [] }] })
    expect(() => toApiView(query)).toThrow(MappingError)
  })
})

describe('ColumnNames', () => {
  const names = new ColumnNames(createDefaultColumns())

  it('resolves names back to keys, with the year of a band column', () => {
    expect(names.resolve('Age')).toEqual({ key: 'age', year: null })
    expect(names.resolve('Time burden (min) band')).toEqual({ key: 'timeBand', year: null })
    expect(names.resolve('Time burden (min) band 2024')).toEqual({ key: 'timeBand', year: 2024 })
    expect(names.resolve('Unknown')).toBeNull()
  })

  it('rejects unknown keys', () => {
    expect(() => names.nameOf('nope')).toThrow(MappingError)
  })
})
