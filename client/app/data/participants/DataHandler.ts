import type { ApiConsumer } from '../api/ApiConsumer'
import type { RowSource } from '../rowSources/RowSource'
import type { DatasetInfo } from '../types/dataset'
import type { ParticipantDetails } from '../types/participant'
import type { SearchResult } from '../types/search'
import { SEARCH_LIMIT } from '../config'

export class DataHandler {
  private api: ApiConsumer
  private rowSource: RowSource

  constructor(api: ApiConsumer, rowSource: RowSource) {
    this.api = api
    this.rowSource = rowSource
  }

  getDatasetInfo(): Promise<DatasetInfo> {
    return this.api.getDatasetInfo()
  }

  getParticipant(participantId: string): Promise<ParticipantDetails> {
    return this.api.getParticipant(participantId)
  }

  searchParticipants(text: string): Promise<SearchResult> {
    return this.api.searchParticipants(text.trim(), SEARCH_LIMIT)
  }
}
