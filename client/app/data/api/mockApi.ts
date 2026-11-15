import { MOCK_DELAY_MS } from '../config'
import { getPageOfRows, runPipeline } from '../pipeline/runPipeline'
import type { DatasetInfo } from '../types/dataset'
import type { Participant, ParticipantDetails } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'
import type { ApiConsumer } from './ApiConsumer'
import { ApiError } from './ApiError'
import { MOCK_DATABASE } from './mockDatabase'
import { buildAllParticipantDetails } from './mockServer'
import type { SearchResult } from '../types/search'

const MOCK_PARTICIPANTS = buildAllParticipantDetails(MOCK_DATABASE)

let delayMs = MOCK_DELAY_MS
let failNextRequest = false

export const mockApiControls = {
  setDelayMs(milliseconds: number): void {
    delayMs = milliseconds
  },

  failNextRequest(): void {
    failNextRequest = true
  },
}

export const mockApi: ApiConsumer = {
  getDatasetInfo(): Promise<DatasetInfo> {
    return fakeRequest(() => buildDatasetInfo())
  },

  getParticipant(participantId: string): Promise<ParticipantDetails> {
    return fakeRequest(() => {
      const participant = MOCK_PARTICIPANTS.find((p) => p.participantId === participantId)
      if (participant === undefined) {
        throw new ApiError('notFound', `No participant with ID ${participantId} exists in the database.`)
      }
      return participant
    })
  },

  getAllParticipants(): Promise<Participant[]> {
    return fakeRequest(() => MOCK_PARTICIPANTS.map(toParticipant))
  },

  getPageParticipants(pageSize: number, pageNumber: number, query: ViewQuery): Promise<RowPage> {
    return fakeRequest(() => {
      const participants = MOCK_PARTICIPANTS.map(toParticipant)
      const rows = runPipeline(participants, query)
      return getPageOfRows(rows, pageNumber, pageSize)
    })
  },

  getAllParticipantRows(query: ViewQuery): Promise<ViewRow[]> {
    return fakeRequest(() => {
      const participants = MOCK_PARTICIPANTS.map(toParticipant)
      return runPipeline(participants, query)
    })
  },

  searchParticipants(query: string, limit: number): Promise<SearchResult> {
    return fakeRequest(() => {
      const text = query.trim().toLowerCase()
      if (text === '') {
        throw new ApiError('invalidQuery', 'Enter a participant ID, name, email address or phone number.')
      }
      if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
        throw new ApiError('invalidQuery', 'The search limit must be between 1 and 250.')
      }

      const held = buildDatasetInfo().contactFields            // URF 2.7
      const looksLikePhone = /^[\d\s()+-]+$/.test(text)
      const digits = text.replace(/\D/g, '')

      const matches = MOCK_PARTICIPANTS.filter((p) =>
        p.participantId.toLowerCase().startsWith(text) ||                           // URF 3.2
        (held.includes('name') && contains(p.name, text)) ||                        // URF 3.6
        (held.includes('email') && contains(p.email, text)) ||
        (held.includes('phone') && looksLikePhone && digits !== '' &&
          (p.phone ?? '').replace(/\D/g, '').includes(digits)),
      ).sort((a, b) => a.participantId.localeCompare(b.participantId, undefined, { numeric: true }))

      return {
        total: matches.length,
        participants: matches.slice(0, limit).map((p) => ({ participantId: p.participantId, name: p.name })),
      }
    })
  },
}

async function fakeRequest<T>(produce: () => T): Promise<T> {
  await wait(delayMs)
  if (failNextRequest) {
    failNextRequest = false
    throw new ApiError('network', 'Could not reach the server. Check your network connection and try again.')
  }
  return structuredClone(produce())
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function toParticipant(details: ParticipantDetails): Participant {
  return {
    participantId: details.participantId,
    name: details.name,
    email: details.email,
    phone: details.phone,
    age: details.age,
    sex: details.sex,
    race: details.race,
    county: details.county,
    state: details.state,
    studyStatus: details.studyStatus,
    yearlyTotals: details.yearlyTotals,
  }
}

function buildDatasetInfo(): DatasetInfo {
  const years = new Set<number>()
  for (const participant of MOCK_PARTICIPANTS) {
    for (const totals of participant.yearlyTotals) {
      years.add(totals.year)
    }
  }

  return {
    refreshedAt: new Date().toISOString(),
    dataSourceMode: 'internal',
    years: [...years].sort((a, b) => a - b),

    contactFields: ['email', 'phone'],
    categoryValues: {
      sex: distinctValues((p) => p.sex),
      race: distinctValues((p) => p.race),
      county: distinctValues((p) => p.county),
      state: distinctValues((p) => p.state),
      studyStatus: distinctValues((p) => p.studyStatus),
    },
  }
}

function distinctValues(getValue: (participant: Participant) => string | null): string[] {
  const values = new Set<string>()
  for (const participant of MOCK_PARTICIPANTS) {
    const value = getValue(participant)
    if (value !== null) {
      values.add(value)
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function contains(value: string | null, text: string): boolean {
  return value !== null && value.toLowerCase().includes(text)
}
