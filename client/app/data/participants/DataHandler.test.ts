import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import type { ApiConsumer } from '../api/ApiConsumer'
import type { ApiMeta, ApiParticipant, ParticipantBurden } from '../api/apiTypes'
import { DataHandler } from './DataHandler'

const meta: ApiMeta = {
  dataSourceMode: 'internal',
  contactDetails: { name: false, email: true, phone: true },
  years: [2024, 2025],
  dataRefreshedAt: '2026-11-11T12:00:00Z',
  unlinkedRecordCount: 0,
}

const participant: ApiParticipant = {
  participantId: 'P001',
  name: null,
  email: 'p001@example.org',
  phone: null,
  age: 52,
  sex: 'Female',
  race: 'White',
  county: 'Bexar',
  state: 'TX',
  studyStatus: 'Active',
}

const emptySummary = { timeMinutes: 0, timeByExamElement: [], radiationMsv: 0, contactFrequency: 0, participation: 0 }
const burden: ParticipantBurden = { cumulative: emptySummary, perYear: [] }

/** An ApiConsumer whose methods are vi.fn()s; override the ones a test needs. */
function fakeApi(overrides: Partial<Record<keyof ApiConsumer, (...args: never[]) => unknown>> = {}) {
  const api = {
    getMeta: vi.fn(async () => meta),
    listColumns: vi.fn(async () => [{ name: 'Sex', type: 'categorical', values: ['Female', 'Male'], isDefault: true }]),
    getParticipant: vi.fn(async () => participant),
    getParticipantBurden: vi.fn(async () => burden),
    listParticipantActivities: vi.fn(async () => []),
    searchParticipants: vi.fn(async () => ({ total: 30, participants: [{ participantId: 'P001', name: null }] })),
    getBurdenPresets: vi.fn(async () => [
      {
        name: 'Contact frequency burden',
        formula: '[Emails sent] + [SMS sent]',
        bands: [{ label: 'Low', upperBound: 5 }, { label: 'Medium', upperBound: 13 }, { label: 'High' }],
        isDefault: false,
      },
    ]),
    ...overrides,
  }
  return api as typeof api & ApiConsumer
}

const signal = new AbortController().signal

describe('DataHandler', () => {
  it('combines /meta and /columns into DatasetInfo, passing the signal to both', async () => {
    const api = fakeApi()

    const info = await new DataHandler(api).getDatasetInfo({ signal })

    expect(info).toMatchObject({ years: [2024, 2025], contactFields: ['email', 'phone'], categoryValues: { sex: ['Female', 'Male'] } })
    expect(api.getMeta).toHaveBeenCalledWith({ signal })
    expect(api.listColumns).toHaveBeenCalledWith({ signal })
  })

  it('combines the three participant endpoints', async () => {
    const api = fakeApi()

    const details = await new DataHandler(api).getParticipant('P001', { signal })

    expect(details).toMatchObject({ participantId: 'P001', email: 'p001@example.org', activities: [] })
    expect(api.getParticipant).toHaveBeenCalledWith('P001', { signal })
    expect(api.getParticipantBurden).toHaveBeenCalledWith('P001', { signal })
    expect(api.listParticipantActivities).toHaveBeenCalledWith('P001', { signal })
  })

  it('names the ID when a participant is not found and the server gave no message (URF 1.8)', async () => {
    const notFound = new ApiError('notFound', 'The requested item does not exist.', { status: 404 })
    const api = fakeApi({ getParticipant: vi.fn(async () => Promise.reject(notFound)) })

    await expect(new DataHandler(api).getParticipant('P999')).rejects.toMatchObject({
      kind: 'notFound',
      status: 404,
      message: 'No participant with ID P999 was found.',
    })
  })

  it('keeps the server message for a not-found participant when there is one', async () => {
    const problem = { type: 'urn:problem:not-found', title: 'Not found', detail: 'Participant P999 does not exist.' }
    const notFound = new ApiError('notFound', problem.detail, { status: 404, problem })
    const api = fakeApi({ getParticipant: vi.fn(async () => Promise.reject(notFound)) })

    await expect(new DataHandler(api).getParticipant('P999')).rejects.toBe(notFound)
  })

  it('searches with the trimmed text and keeps the total', async () => {
    const api = fakeApi()

    const result = await new DataHandler(api).searchParticipants('  P00 ', 25, { signal })

    expect(api.searchParticipants).toHaveBeenCalledWith('P00', 25, { signal })
    expect(result).toEqual({ total: 30, participants: [{ participantId: 'P001', name: null }] })
  })

  it('sends no search for empty text', async () => {
    const api = fakeApi()

    await expect(new DataHandler(api).searchParticipants('   ')).resolves.toEqual({ total: 0, participants: [] })
    expect(api.searchParticipants).not.toHaveBeenCalled()
  })

  it('maps burden presets to the frontend band shape', async () => {
    const presets = await new DataHandler(fakeApi()).getBurdenPresets()

    expect(presets).toEqual([
      {
        name: 'Contact frequency burden',
        formula: '[Emails sent] + [SMS sent]',
        bands: [
          { label: 'Low', below: 5 },
          { label: 'Medium', below: 13 },
          { label: 'High', below: null },
        ],
        isDefault: false,
      },
    ])
  })
})
