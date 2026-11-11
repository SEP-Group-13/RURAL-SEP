import type { ApiConsumer, RequestOptions } from '../api/ApiConsumer'
import { fromParticipantPage, toQueryParticipantsRequest } from '../api/mappers'
import type { ParticipantRowPage } from '../api/mappers'
import type { ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'
import type { RowSource } from './RowSource'

/**
 * Rows computed by the server: filters, formulas, simulations, bands, sorting and paging all happen
 * in POST /participants/query. The browser only sends the view and shows the page it gets back.
 */
export class ServerRowSource implements RowSource {
  private api: ApiConsumer

  constructor(api: ApiConsumer) {
    this.api = api
  }

  /**
   * Rejects with a MappingError (nothing is sent) when the view cannot be expressed as a request,
   * with an ApiError when the request fails, or with the abort error when aborted.
   */
  async getPage(
    pageSize: number,
    pageNumber: number,
    query: ViewQuery,
    options?: RequestOptions,
  ): Promise<ParticipantRowPage> {
    const { body, names } = toQueryParticipantsRequest(query, pageNumber, pageSize)
    const page = await this.api.queryParticipants(body, options)
    return fromParticipantPage(page, names)
  }

  /** @deprecated See RowSource.getAllRows. The API cannot return every row of a view. */
  getAllRows(_query: ViewQuery): Promise<ViewRow[]> {
    return Promise.reject(
      new Error('Loading all rows of a view is not supported by the API. Use the chart endpoints instead.'),
    )
  }

  /** Nothing to reload: every request reads the latest data from the server. */
  async reload(): Promise<void> {}
}
