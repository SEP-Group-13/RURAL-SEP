import { describe, expect, it, vi } from 'vitest'
import type { ApiConsumer } from '../api/ApiConsumer'
import type { ParticipantPage } from '../api/apiTypes'
import { MappingError } from '../api/mappers/MappingError'
import type { ViewQuery } from '../types/view'
import { createDefaultViewSettings, getQueryFromSettings } from '../views/viewSettings'
import { ServerRowSource } from './ServerRowSource'

const query: ViewQuery = {
  ...getQueryFromSettings(createDefaultViewSettings('Default view')),
  filters: [{ columnKey: 'sex', operator: 'in', value: ['Female'] }],
  sort: { columnKey: 'age', direction: 'desc' },
  selectedYears: [2024, 2025],
}

const page: ParticipantPage = {
  total: 26,
  page: 2,
  pageSize: 25,
  columns: ['Participant ID', 'Age', 'Time burden (min)', 'Time burden (min) band 2024', 'Time burden (min) band 2025'],
  rows: [
    {
      participantId: 'P026',
      values: {
        'Participant ID': 'P026',
        Age: 41,
        'Time burden (min)': 200,
        'Time burden (min) band 2024': 'Low',
        'Time burden (min) band 2025': 'Medium',
      },
    },
  ],
}

function fakeApi(response: Promise<ParticipantPage> = Promise.resolve(page)) {
  const queryParticipants = vi.fn((..._args: Parameters<ApiConsumer['queryParticipants']>) => response)
  return { api: { queryParticipants } as unknown as ApiConsumer, queryParticipants }
}

describe('ServerRowSource.getPage', () => {
  it('sends the view as POST /participants/query, with the signal', async () => {
    const { api, queryParticipants } = fakeApi()
    const signal = new AbortController().signal

    await new ServerRowSource(api).getPage(25, 2, query, { signal })

    expect(queryParticipants).toHaveBeenCalledTimes(1)
    const [body, options] = queryParticipants.mock.calls[0]!
    expect(body).toMatchObject({
      view: { years: [2024, 2025], filters: [{ column: 'Sex', values: ['Female'] }] },
      sort: { column: 'Age', direction: 'desc' },
      page: { page: 2, pageSize: 25 },
    })
    expect(body.columns[0]).toBe('Participant ID')
    expect(options?.signal).toBe(signal)
  })

  it('returns the page with cells keyed by column key and per-year band cells', async () => {
    const result = await new ServerRowSource(fakeApi().api).getPage(25, 2, query)

    expect(result).toMatchObject({ pageNumber: 2, pageSize: 25, totalRows: 26, totalPages: 2 })
    expect(result.bandYears).toEqual({ timeBand: [2024, 2025] })
    expect(result.rows[0]).toEqual({
      participantId: 'P026',
      cells: { participantId: 'P026', age: 41, timeBurden: 200, 'timeBand:2024': 'Low', 'timeBand:2025': 'Medium' },
    })
  })

  it('rejects with a MappingError and sends nothing when the view cannot be expressed', async () => {
    const { api, queryParticipants } = fakeApi()
    const empty: ViewQuery = { ...query, filters: [{ columnKey: 'sex', operator: 'in', value: [] }] }

    await expect(new ServerRowSource(api).getPage(25, 1, empty)).rejects.toBeInstanceOf(MappingError)
    expect(queryParticipants).not.toHaveBeenCalled()
  })

  it('passes API errors through', async () => {
    const error = new Error('Unknown column [X].')
    const { api } = fakeApi(Promise.reject(error))
    await expect(new ServerRowSource(api).getPage(25, 1, query)).rejects.toBe(error)
  })
})
