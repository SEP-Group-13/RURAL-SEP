import type { DatasetInfo } from '../types/dataset'
import type { Participant, ParticipantDetails } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'

/**
 * @deprecated The pre-spec interface, still used by mockApi, the row sources and DataHandler.
 * Replaced by `ApiConsumer` (one method per spec operation). Delete once Part C of the
 * API integration has moved its callers over.
 */
export interface LegacyApiConsumer {
  getDatasetInfo(): Promise<DatasetInfo>

  getParticipant(participantId: string): Promise<ParticipantDetails>

  getAllParticipants(): Promise<Participant[]>

  getPageParticipants(pageSize: number, pageNumber: number, query: ViewQuery): Promise<RowPage>

  getAllParticipantRows(query: ViewQuery): Promise<ViewRow[]>
}
