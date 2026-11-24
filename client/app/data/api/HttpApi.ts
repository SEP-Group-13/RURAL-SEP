import * as Api from '@shared/api/generated/api.zod'
import type { ApiConsumer, RequestOptions } from './ApiConsumer'
import { call } from './httpClient'

const signal = (options?: RequestOptions) => ({ signal: options?.signal })
const participant = (participantId: string) => `/participants/${encodeURIComponent(participantId)}`

/** ApiConsumer that talks to the real server (or to MSW in development). */
export const httpApi: ApiConsumer = {
  getMeta: (options) => call(Api.GetMetaInfoResponse, '/meta/info', signal(options)),

  listColumns: async (options) => (await call(Api.GetMetaColumnsResponse, '/meta/columns', signal(options))).columns,

  getBurdenPresets: async (options) =>
    (await call(Api.GetMetaBurdenPresetsResponse, '/meta/burden-presets', signal(options))).presets,

  queryParticipants: (body, options) =>
    call(Api.PostParticipantsQueryResponse, '/participants/query', { method: 'POST', body, ...signal(options) }),

  searchParticipants: (query, limit, options) =>
    call(Api.GetParticipantsSearchResponse, '/participants/search', { query: { query, limit }, ...signal(options) }),

  getParticipant: (participantId, options) =>
    call(Api.GetParticipantsParticipantIdResponse, participant(participantId), signal(options)),

  getParticipantBurden: (participantId, options) =>
    call(Api.GetParticipantsParticipantIdBurdenResponse, `${participant(participantId)}/burden`, signal(options)),

  listParticipantActivities: async (participantId, options) =>
    (await call(Api.GetParticipantsParticipantIdActivitiesResponse, `${participant(participantId)}/activities`, signal(options)))
      .activities,

  queryChartCounts: (body, options) =>
    call(Api.PostChartsCountsResponse, '/charts/counts', { method: 'POST', body, ...signal(options) }),

  queryChartHistogram: (body, options) =>
    call(Api.PostChartsHistogramResponse, '/charts/histogram', { method: 'POST', body, ...signal(options) }),
}
