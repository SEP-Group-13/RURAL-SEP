import type { DatasetInfo } from '../types/dataset'
import type { Participant, ParticipantDetails } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'

export interface ApiConsumer {
  getDatasetInfo(): Promise<DatasetInfo>

  getParticipant(participantId: string): Promise<ParticipantDetails>

  getAllParticipants(): Promise<Participant[]>

  getPageParticipants(pageSize: number, pageNumber: number, query: ViewQuery): Promise<RowPage>

  getAllParticipantRows(query: ViewQuery): Promise<ViewRow[]>
}
