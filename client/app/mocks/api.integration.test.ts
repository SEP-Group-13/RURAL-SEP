import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ApiError } from '../data/api/ApiError'
import { httpApi } from '../data/api/HttpApi'
import type { ParticipantRowPage } from '../data/api/mappers'
import { ChartHandler } from '../data/charts/ChartHandler'
import { DataHandler } from '../data/participants/DataHandler'
import { ServerRowSource } from '../data/rowSources/ServerRowSource'
import type { Column } from '../data/types/column'
import type { ViewQuery } from '../data/types/view'
import { createDefaultViewSettings, getQueryFromSettings } from '../data/views/viewSettings'
import { MOCK_DATABASE } from './data/mockDatabase'
import { mockControls } from './handlers'
import { server } from './node'

// The whole chain: data layer → httpApi (openapi-fetch) → MSW → mock backend → mappers.

const rowSource = new ServerRowSource(httpApi)
const dataHandler = new DataHandler(httpApi)
const chartHandler = new ChartHandler(httpApi)

const ALL = MOCK_DATABASE.participant.length
const defaultSettings = createDefaultViewSettings('Default view')
const defaultQuery = getQueryFromSettings(defaultSettings)

beforeAll(() => {
  mockControls.setDelayMs(0)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const getPage = (query: ViewQuery, page = 1) => rowSource.getPage(25, page, query) as Promise<ParticipantRowPage>

describe('participant table through the API mock', () => {
  it('returns the first page of the default view, with per-year bands', async () => {
    const [page, info] = await Promise.all([getPage(defaultQuery), dataHandler.getDatasetInfo()])

    expect(page.totalRows).toBe(ALL)
    expect(page.rows).toHaveLength(Math.min(25, ALL))
    expect(page.bandYears).toEqual({ timeBand: info.years, radiationBand: info.years })
    const first = page.rows[0]!
    expect(first.cells.participantId).toBe(first.participantId)
    expect(typeof first.cells.timeBurden).toBe('number')
    expect(['Low', 'Medium', 'High']).toContain(first.cells[`timeBand:${info.years[0]}`])
  })

  it('filters and sorts on the server', async () => {
    const query: ViewQuery = {
      ...defaultQuery,
      filters: [{ columnKey: 'sex', operator: 'in', value: ['Female'] }],
      sort: { columnKey: 'age', direction: 'asc' },
    }
    const page = await getPage(query)

    expect(page.totalRows).toBeGreaterThan(0)
    expect(page.totalRows).toBeLessThan(ALL)
    expect(page.rows.every((row) => row.cells.sex === 'Female')).toBe(true)
    const ages = page.rows.map((row) => row.cells.age as number)
    expect(ages).toEqual([...ages].sort((a, b) => a - b))
  })

  it('computes simulations and formulas on the server', async () => {
    const simulation: Column = {
      key: 'simulation1',
      label: 'Bone scan (mSv)',
      dataType: 'number',
      group: 'Simulations',
      visible: true,
      removable: true,
      source: { kind: 'simulation', value: 5 },
    }
    const formula: Column = {
      key: 'formula1',
      label: 'Radiation after scan (mSv)',
      dataType: 'number',
      group: 'Burden formulas',
      visible: true,
      removable: true,
      source: { kind: 'formula', expression: '[radiationBurden] + [simulation1]' },
    }
    const page = await getPage({ ...defaultQuery, columns: [...defaultQuery.columns, simulation, formula] })

    for (const row of page.rows) {
      expect(row.cells.simulation1).toBe(5)
      expect(row.cells.formula1).toBeCloseTo((row.cells.radiationBurden as number) + 5)
    }
  })

  it('reports an invalid formula as a 422 that points at it', async () => {
    const formula: Column = {
      key: 'formula1',
      label: 'Bad',
      dataType: 'number',
      group: 'Burden formulas',
      visible: true,
      removable: true,
      source: { kind: 'formula', expression: '[sex] * 2' },
    }
    const error = await getPage({ ...defaultQuery, columns: [...defaultQuery.columns, formula] }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'invalidQuery', status: 422 })
    expect((error as ApiError).problem?.errors?.[0]?.pointer).toBe('/view/formulas/0/expression')
  })

  it('returns an empty page past the last one', async () => {
    const page = await getPage(defaultQuery, 1000)
    expect(page.rows).toEqual([])
    expect(page.totalRows).toBe(ALL)
  })
})

describe('dataset, participants and search through the API mock', () => {
  it('loads the dataset info', async () => {
    const info = await dataHandler.getDatasetInfo()

    expect(info.dataSourceMode).toBe('internal')
    expect(info.years.length).toBeGreaterThan(0)
    expect(info.contactFields).not.toContain('name')
    expect(info.categoryValues.sex).toContain('Female')
  })

  it('loads one participant, and names an unknown ID', async () => {
    const id = MOCK_DATABASE.participant[0]!.participant_identifier
    const details = await dataHandler.getParticipant(id)

    expect(details.participantId).toBe(id)
    expect(details.activities.length).toBeGreaterThan(0)
    await expect(dataHandler.getParticipant('NOPE')).rejects.toMatchObject({
      kind: 'notFound',
      message: 'No participant with ID NOPE exists.',
    })
  })

  it('searches by ID prefix', async () => {
    const result = await dataHandler.searchParticipants('P000')

    expect(result.total).toBeGreaterThan(0)
    expect(result.participants.every((p) => p.participantId.startsWith('P000'))).toBe(true)
  })

  it('loads the burden presets', async () => {
    const presets = await dataHandler.getBurdenPresets()
    expect(presets.find((p) => p.name === 'Contact frequency burden')?.formula).toBe('[Emails sent] + [SMS sent]')
  })
})

describe('charts through the API mock', () => {
  it('counts every participant once per series', async () => {
    const counts = await chartHandler.getCounts([defaultSettings], 'studyStatus')

    expect(counts.series).toHaveLength(1)
    expect(counts.series[0]!.viewId).toBe(defaultSettings.id)
    expect(counts.series[0]!.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(ALL)
  })

  it('gives one series per selected year for a band column', async () => {
    const settings = { ...defaultSettings, selectedYears: [2025] }
    const counts = await chartHandler.getCounts([settings], 'timeBand')

    expect(counts.series.map((s) => s.year)).toEqual([2025])
    expect(counts.series[0]!.buckets.map((b) => b.label)).toEqual(['Low', 'Medium', 'High'])
  })

  it('builds a histogram with aligned bins', async () => {
    const histogram = await chartHandler.getHistogram([defaultSettings], 'age', 10)
    const bins = histogram.series[0]!.bins

    expect(bins.every((bin) => bin.lowerBound % 10 === 0)).toBe(true)
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(
      MOCK_DATABASE.participant.filter((p) => p.age !== null).length,
    )
  })
})

describe('mock controls', () => {
  it('fails the next request as a network error', async () => {
    mockControls.failNextRequest()
    await expect(dataHandler.getDatasetInfo()).rejects.toMatchObject({ kind: 'network' })
    await expect(dataHandler.getDatasetInfo()).resolves.toBeDefined()
  })
})
