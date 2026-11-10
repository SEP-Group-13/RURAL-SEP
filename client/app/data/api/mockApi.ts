import { MOCK_DELAY_MS } from '../config'
import { getPageOfRows, runPipeline } from '../pipeline/runPipeline'
import type { DatasetInfo } from '../types/dataset'
import type { Participant, ParticipantDetails } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'
import type { LegacyApiConsumer } from './LegacyApiConsumer'
import { ApiError } from './ApiError'
import { MOCK_DATABASE } from './mockDatabase'
import { buildAllParticipantDetails } from './mockServer'

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

export const mockApi: LegacyApiConsumer = {
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
