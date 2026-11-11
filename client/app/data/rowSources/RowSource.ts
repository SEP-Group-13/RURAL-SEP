import type { RequestOptions } from '../api/ApiConsumer'
import type { RowPage } from '../types/rows'
import type { ViewQuery } from '../types/view'

export interface RowSource {
  /** One page of the view's rows. `options.signal` aborts the request. */
  getPage(pageSize: number, pageNumber: number, query: ViewQuery, options?: RequestOptions): Promise<RowPage>
}
