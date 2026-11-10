import type { LegacyApiConsumer } from '../api/LegacyApiConsumer'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'
import type { RowSource } from './RowSource'

export class ServerRowSource implements RowSource {
  private api: LegacyApiConsumer

  constructor(api: LegacyApiConsumer) {
    this.api = api
  }

  getPage(pageSize: number, pageNumber: number, query: ViewQuery): Promise<RowPage> {
    return this.api.getPageParticipants(pageSize, pageNumber, query)
  }

  getAllRows(query: ViewQuery): Promise<ViewRow[]> {
    return this.api.getAllParticipantRows(query)
  }

  async reload(): Promise<void> {}
}
