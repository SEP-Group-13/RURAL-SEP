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

/** Options every request accepts. */
export interface RequestOptions {
  /**
   * Aborts the request, e.g. when the view changed before the response arrived.
   * The method then rejects with the abort error itself (check with `isAbortError`), not an ApiError.
   */
  signal?: AbortSignal
}

/**
 * One method per operation in the OpenAPI spec, using the spec's own types.
 *
 * This layer only transports data: it does not translate to the UI's types (that is the job of
 * the mappers). List wrappers such as `{ columns: [...] }` are unwrapped here.
 * Every method rejects with an `ApiError` on failure, or with the abort error when aborted.
 */
export interface ApiConsumer {
  /** GET /meta */
  getMeta(options?: RequestOptions): Promise<ApiMeta>

  /** GET /columns, in default display order */
  listColumns(options?: RequestOptions): Promise<ApiColumn[]>

  /** GET /burden-presets */
  getBurdenPresets(options?: RequestOptions): Promise<BurdenPreset[]>

  /** POST /participants/query */
  queryParticipants(body: QueryParticipantsRequest, options?: RequestOptions): Promise<ParticipantPage>

  /** GET /participants/search */
  searchParticipants(query: string, limit?: number, options?: RequestOptions): Promise<ParticipantSearchResult>

  /** GET /participants/{participantId} */
  getParticipant(participantId: string, options?: RequestOptions): Promise<ApiParticipant>

  /** GET /participants/{participantId}/burden */
  getParticipantBurden(participantId: string, options?: RequestOptions): Promise<ParticipantBurden>

  /** GET /participants/{participantId}/activities, ascending by date */
  listParticipantActivities(participantId: string, options?: RequestOptions): Promise<ApiActivity[]>

  /** POST /charts/counts */
  queryChartCounts(body: CountChartRequest, options?: RequestOptions): Promise<CountChartResponse>

  /** POST /charts/histogram */
  queryChartHistogram(body: HistogramRequest, options?: RequestOptions): Promise<HistogramResponse>
}
