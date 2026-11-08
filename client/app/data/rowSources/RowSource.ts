import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'

export interface RowSource {
  getPage(pageSize: number, pageNumber: number, query: ViewQuery): Promise<RowPage>

  getAllRows(query: ViewQuery): Promise<ViewRow[]>

  reload(): Promise<void>
}
