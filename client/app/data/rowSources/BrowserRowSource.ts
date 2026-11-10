import type { ApiConsumer } from '../api/ApiConsumer'
import { getPageOfRows, runPipeline } from '../pipeline/runPipeline'
import type { Participant } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'
import type { RowSource } from './RowSource'

export class BrowserRowSource implements RowSource {
  private api: ApiConsumer
  private participants: Promise<Participant[]> | null = null

  constructor(api: ApiConsumer) {
    this.api = api
  }

  async getPage(pageSize: number, pageNumber: number, query: ViewQuery): Promise<RowPage> {
    const rows = await this.getAllRows(query)
    return getPageOfRows(rows, pageNumber, pageSize)
  }

  async getAllRows(query: ViewQuery): Promise<ViewRow[]> {
    const participants = await this.loadParticipants()
    return runPipeline(participants, query)
  }

  async reload(): Promise<void> {
    this.participants = null
    await this.loadParticipants()
  }

  private loadParticipants(): Promise<Participant[]> {
    if (this.participants === null) {
      this.participants = this.api.getAllParticipants().catch((error: unknown) => {
        this.participants = null
        throw error
      })
    }
    return this.participants
  }
}
