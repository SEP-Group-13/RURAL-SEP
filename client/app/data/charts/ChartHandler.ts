import type { ApiConsumer, RequestOptions } from '../api/ApiConsumer'
import { fromCountChartResponse, fromHistogramResponse, toCountChartRequest, toHistogramRequest } from '../api/mappers'
import type { ChartCounts, Histogram } from '../types/charts'
import type { ViewSettings } from '../types/view'

/**
 * Chart data computed by the server for one or more views (several views compare them).
 * Each method rejects with a MappingError (nothing is sent) when the request cannot be built,
 * with an ApiError when it fails, or with the abort error when aborted.
 */
export class ChartHandler {
  private api: ApiConsumer

  constructor(api: ApiConsumer) {
    this.api = api
  }

  /** Participants per value of a category or band column (bar, line and pie charts). */
  async getCounts(views: ViewSettings[], columnKey: string, options?: RequestOptions): Promise<ChartCounts> {
    const body = toCountChartRequest(views, columnKey)
    const response = await this.api.queryChartCounts(body, options)
    return fromCountChartResponse(response, views.map((view) => view.id), columnKey)
  }

  /** Participants per bin of a numeric column. */
  async getHistogram(
    views: ViewSettings[],
    columnKey: string,
    binWidth: number,
    options?: RequestOptions,
  ): Promise<Histogram> {
    const body = toHistogramRequest(views, columnKey, binWidth)
    const response = await this.api.queryChartHistogram(body, options)
    return fromHistogramResponse(response, views.map((view) => view.id), columnKey, binWidth)
  }
}
