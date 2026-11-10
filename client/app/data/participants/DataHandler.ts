import type { LegacyApiConsumer } from '../api/LegacyApiConsumer'
import { createDefaultColumns } from '../columns/defaultColumns'
import type { RowSource } from '../rowSources/RowSource'
import type { DatasetInfo } from '../types/dataset'
import type { ParticipantDetails } from '../types/participant'
import type { ViewQuery } from '../types/view'

export interface SearchResult {
  participantId: string
  name: string | null
}

export class DataHandler {
  private api: LegacyApiConsumer
  private rowSource: RowSource

  constructor(api: LegacyApiConsumer, rowSource: RowSource) {
    this.api = api
    this.rowSource = rowSource
  }

  getDatasetInfo(): Promise<DatasetInfo> {
    return this.api.getDatasetInfo()
  }

  getParticipant(participantId: string): Promise<ParticipantDetails> {
    return this.api.getParticipant(participantId)
  }

  async searchParticipants(text: string): Promise<SearchResult[]> {
    const searchText = text.trim()
    if (searchText === '') {
      return []
    }

    const query: ViewQuery = {
      columns: createDefaultColumns().filter((c) => c.key === 'participantId' || c.key === 'name'),
      filters: [{ columnKey: 'participantId', operator: 'startsWith', value: searchText }],
      sort: { columnKey: 'participantId', direction: 'asc' },
      selectedYears: 'all',
      excludedIds: [],
    }
    const rows = await this.rowSource.getAllRows(query)

    return rows.map((row) => {
      const name = row.cells.name
      return {
        participantId: row.participantId,
        name: typeof name === 'string' ? name : null,
      }
    })
  }
}
