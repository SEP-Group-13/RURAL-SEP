import { ApiError } from '../api/ApiError'
import type { ApiConsumer, RequestOptions } from '../api/ApiConsumer'
import { toBurdenPresets, toDatasetInfo, toParticipantDetails } from '../api/mappers'
import type { BurdenPreset } from '../types/burden'
import type { DatasetInfo } from '../types/dataset'
import type { ParticipantDetails } from '../types/participant'

export interface SearchResult {
  participantId: string
  name: string | null
}

export interface SearchResults {
  /** Number of matches, which can exceed the participants returned. */
  total: number
  participants: SearchResult[]
}

/**
 * Data that does not depend on a view: the dataset, single participants, search and burden presets.
 * Each method rejects with an ApiError when the request fails, or with the abort error when aborted.
 */
export class DataHandler {
  private api: ApiConsumer

  constructor(api: ApiConsumer) {
    this.api = api
  }

  /** GET /meta + /columns. */
  async getDatasetInfo(options?: RequestOptions): Promise<DatasetInfo> {
    const [meta, columns] = await Promise.all([this.api.getMeta(options), this.api.listColumns(options)])
    return toDatasetInfo(meta, columns)
  }

  /** GET /participants/{id}, /burden and /activities. An unknown ID rejects with a `notFound` ApiError. */
  async getParticipant(participantId: string, options?: RequestOptions): Promise<ParticipantDetails> {
    try {
      const [participant, burden, activities] = await Promise.all([
        this.api.getParticipant(participantId, options),
        this.api.getParticipantBurden(participantId, options),
        this.api.listParticipantActivities(participantId, options),
      ])
      return toParticipantDetails(participant, burden, activities)
    } catch (error) {
      throw withParticipantNotFoundMessage(error, participantId)
    }
  }

  /**
   * GET /participants/search: matches the start of the participant ID, and names, emails and phones
   * when the data source holds them. Empty text matches nothing and sends no request.
   */
  async searchParticipants(text: string, limit?: number, options?: RequestOptions): Promise<SearchResults> {
    const query = text.trim()
    if (query === '') {
      return { total: 0, participants: [] }
    }
    const result = await this.api.searchParticipants(query, limit, options)
    return {
      total: result.total,
      participants: result.participants.map(({ participantId, name }) => ({ participantId, name })),
    }
  }

  /** GET /burden-presets. */
  async getBurdenPresets(options?: RequestOptions): Promise<BurdenPreset[]> {
    return toBurdenPresets(await this.api.getBurdenPresets(options))
  }
}

/** A 404 without a server message gets one that names the ID (URF 1.8). */
function withParticipantNotFoundMessage(error: unknown, participantId: string): unknown {
  if (error instanceof ApiError && error.kind === 'notFound' && !error.problem?.detail) {
    return new ApiError('notFound', `No participant with ID ${participantId} was found.`, {
      status: error.status,
      problem: error.problem,
    })
  }
  return error
}
