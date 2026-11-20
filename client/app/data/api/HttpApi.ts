import type { ApiConsumer, RequestOptions } from './ApiConsumer'
import { call, http } from './httpClient'

const participantPath = (participantId: string, options?: RequestOptions) => ({
  params: { path: { participantId } },
  signal: options?.signal,
})

/** ApiConsumer that talks to the real server (or to MSW in development). */
export const httpApi: ApiConsumer = {
  getMeta: (options) => call(http.GET('/meta', { signal: options?.signal })),

  listColumns: async (options) => (await call(http.GET('/columns', { signal: options?.signal }))).columns,

  getBurdenPresets: async (options) =>
    (await call(http.GET('/burden-presets', { signal: options?.signal }))).presets,

  queryParticipants: (body, options) => call(http.POST('/participants/query', { body, signal: options?.signal })),

  searchParticipants: (query, limit, options) =>
    call(http.GET('/participants/search', { params: { query: { query, limit } }, signal: options?.signal })),

  getParticipant: (participantId, options) =>
    call(http.GET('/participants/{participantId}', participantPath(participantId, options))),

  getParticipantBurden: (participantId, options) =>
    call(http.GET('/participants/{participantId}/burden', participantPath(participantId, options))),

  listParticipantActivities: async (participantId, options) =>
    (await call(http.GET('/participants/{participantId}/activities', participantPath(participantId, options))))
      .activities,

  queryChartCounts: (body, options) => call(http.POST('/charts/counts', { body, signal: options?.signal })),

  queryChartHistogram: (body, options) => call(http.POST('/charts/histogram', { body, signal: options?.signal })),
}
