import type {
  ApiActivity,
  ApiColumn,
  ApiMeta,
  ApiParticipant,
  BurdenPreset,
  CountChartRequest,
  CountChartResponse,
  HistogramRequest,
  HistogramResponse,
  ParticipantBurden,
  ParticipantPage,
  ParticipantSearchResult,
  QueryParticipantsRequest,
} from './apiTypes'

/**
 * One method per operation in the OpenAPI spec, using the spec's own types.
 *
 * This layer only transports data: it does not translate to the UI's types (that is the job of
 * the mappers). List wrappers such as `{ columns: [...] }` are unwrapped here.
 * Every method rejects with an `ApiError` on failure.
 */
export interface ApiConsumer {
  /** GET /meta */
  getMeta(): Promise<ApiMeta>

  /** GET /columns, in default display order */
  listColumns(): Promise<ApiColumn[]>

  /** GET /burden-presets */
  getBurdenPresets(): Promise<BurdenPreset[]>

  /** POST /participants/query */
  queryParticipants(body: QueryParticipantsRequest): Promise<ParticipantPage>

  /** GET /participants/search */
  searchParticipants(query: string, limit?: number): Promise<ParticipantSearchResult>

  /** GET /participants/{participantId} */
  getParticipant(participantId: string): Promise<ApiParticipant>

  /** GET /participants/{participantId}/burden */
  getParticipantBurden(participantId: string): Promise<ParticipantBurden>

  /** GET /participants/{participantId}/activities, ascending by date */
  listParticipantActivities(participantId: string): Promise<ApiActivity[]>

  /** POST /charts/counts */
  queryChartCounts(body: CountChartRequest): Promise<CountChartResponse>

  /** POST /charts/histogram */
  queryChartHistogram(body: HistogramRequest): Promise<HistogramResponse>
}
