import type { ApiConsumer } from './ApiConsumer'
import { call, http } from './httpClient'

const participantPath = (participantId: string) => ({ params: { path: { participantId } } })

/** ApiConsumer that talks to the real server (or to MSW in development). */
export const httpApi: ApiConsumer = {
  getMeta: () => call(http.GET('/meta')),

  listColumns: async () => (await call(http.GET('/columns'))).columns,

  getBurdenPresets: async () => (await call(http.GET('/burden-presets'))).presets,

  queryParticipants: (body) => call(http.POST('/participants/query', { body })),

  searchParticipants: (query, limit) => call(http.GET('/participants/search', { params: { query: { query, limit } } })),

  getParticipant: (participantId) => call(http.GET('/participants/{participantId}', participantPath(participantId))),

  getParticipantBurden: (participantId) =>
    call(http.GET('/participants/{participantId}/burden', participantPath(participantId))),

  listParticipantActivities: async (participantId) =>
    (await call(http.GET('/participants/{participantId}/activities', participantPath(participantId)))).activities,

  queryChartCounts: (body) => call(http.POST('/charts/counts', { body })),

  queryChartHistogram: (body) => call(http.POST('/charts/histogram', { body })),
}
