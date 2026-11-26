import { delay, http, HttpResponse } from 'msw'
import type { JsonBodyType } from 'msw'
import type {
  CountChartRequest,
  HistogramRequest,
  ParticipantSearchResult,
  QueryParticipantsRequest,
} from '../data/api/apiTypes'
import { API_BASE_URL } from '../data/api/httpClient'
import { MOCK_DELAY_MS } from '../data/config'
import { mockBackend, MockProblem } from './backend'

/**
 * One MSW handler per operation in the OpenAPI spec, answered by `mockBackend`.
 * Paths match any origin (`*`), so the same handlers serve the browser and Node tests.
 */

let delayMs = MOCK_DELAY_MS
let failNextRequest = false

/** For trying out the loading and error UI. In the browser: `window.mockControls` (see browser.ts). */
export const mockControls = {
  setDelayMs(milliseconds: number): void {
    delayMs = milliseconds
  },

  /** The next request fails as if the server could not be reached. */
  failNextRequest(): void {
    failNextRequest = true
  },
}

const url = (path: string) => `*${API_BASE_URL}${path}`

/** Runs a backend call with the mock delay, and turns a MockProblem into a problem+json response. */
async function respond(produce: () => JsonBodyType): Promise<Response> {
  await delay(delayMs)
  if (failNextRequest) {
    failNextRequest = false
    return HttpResponse.error()
  }
  try {
    return HttpResponse.json(produce())
  } catch (error) {
    if (error instanceof MockProblem) {
      return HttpResponse.json(error.problem, {
        status: error.status,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    }
    throw error
  }
}

export const handlers = [
  http.get(url('/meta/info'), () => respond(() => mockBackend.getMeta())),

  http.get(url('/meta/columns'), () => respond(() => ({ columns: mockBackend.listColumns() }))),

  http.get(url('/meta/burden-presets'), () => respond(() => ({ presets: mockBackend.getBurdenPresets() }))),

  http.post(url('/participants/query'), async ({ request }) => {
    const body = (await request.json()) as QueryParticipantsRequest
    return respond(() => mockBackend.queryParticipants(body))
  }),

  http.get(url('/participants/search'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const query = params.get('query') ?? ''
    const limit = Number(params.get('limit') ?? 25)
    return respond((): ParticipantSearchResult => {
      if (query === '') {
        throw new MockProblem(400, { type: 'urn:problem:bad-request', title: 'Bad request', detail: 'query is required.' })
      }
      return mockBackend.searchParticipants(query, limit)
    })
  }),

  http.get(url('/participants/:participantId'), ({ params }) =>
    respond(() => mockBackend.getParticipant(String(params.participantId))),
  ),

  http.get(url('/participants/:participantId/burden'), ({ params }) =>
    respond(() => mockBackend.getParticipantBurden(String(params.participantId))),
  ),

  http.get(url('/participants/:participantId/activities'), ({ params }) =>
    respond(() => ({ activities: mockBackend.listParticipantActivities(String(params.participantId)) })),
  ),

  http.post(url('/charts/counts'), async ({ request }) => {
    const body = (await request.json()) as CountChartRequest
    return respond(() => mockBackend.queryChartCounts(body))
  }),

  http.post(url('/charts/histogram'), async ({ request }) => {
    const body = (await request.json()) as HistogramRequest
    return respond(() => mockBackend.queryChartHistogram(body))
  }),
]
