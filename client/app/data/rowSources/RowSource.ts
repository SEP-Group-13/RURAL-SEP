import type { RequestOptions } from '../api/ApiConsumer'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'

export interface RowSource {
  /** One page of the view's rows. `options.signal` aborts the request. */
  getPage(pageSize: number, pageNumber: number, query: ViewQuery, options?: RequestOptions): Promise<RowPage>

  /**
   * @deprecated Loads every row of the view; the API has no such operation. Still used by the
   * visualization (until C4) and search (until C5). Removed together with BrowserRowSource.
   */
  getAllRows(query: ViewQuery): Promise<ViewRow[]>

  reload(): Promise<void>
}
