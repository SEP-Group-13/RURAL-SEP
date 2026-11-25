import type { ChartCounts, Histogram } from '../../types/charts'
import type { Column } from '../../types/column'
import type { ViewQuery } from '../../types/view'
import type { CountChartRequest, CountChartResponse, HistogramRequest, HistogramResponse } from '../apiTypes'
import { MappingError } from './MappingError'
import { ColumnNames, toApiView } from './view'

/** The spec's `maxItems` for `views` in chart requests. */
export const MAX_CHART_VIEWS = 10

/**
 * POST /charts/counts for one or more views (several views compare them, URF 11.x).
 *
 * The column is picked by key in the first view. The API identifies columns by name, so every other
 * view must have a column with that same name (a formula's key can mean different formulas in
 * different views; its name is what the user compares). Only columns with a fixed set of values
 * (categorical or band columns) can be counted (URF 10.2).
 */
export function toCountChartRequest(queries: ViewQuery[], columnKey: string): CountChartRequest {
  const { name, views } = toChartViews(queries, columnKey, (column) => {
    if (column.dataType !== 'category') {
      return `"${column.label}" has no fixed set of values, so participants cannot be counted per value. Choose a category or band column, or use a histogram.`
    }
    return null
  })
  return { views, column: name }
}

/** POST /charts/histogram for one or more views. Only numeric columns (URF 10.5, 11.4). */
export function toHistogramRequest(queries: ViewQuery[], columnKey: string, binWidth: number): HistogramRequest {
  if (!Number.isFinite(binWidth) || binWidth <= 0) {
    throw new MappingError('Enter a bin width larger than 0.')
  }
  const { name, views } = toChartViews(queries, columnKey, (column) => {
    if (column.dataType !== 'number') {
      return `"${column.label}" is not numeric, so it cannot be shown as a histogram.`
    }
    return null
  })
  return { views, column: name, binWidth }
}

/** `viewIds` are the ids of the views sent, in the same order. */
export function fromCountChartResponse(response: CountChartResponse, viewIds: string[], columnKey: string): ChartCounts {
  return {
    columnKey,
    series: response.series.map((series) => ({
      viewId: viewIdAt(viewIds, series.view),
      year: series.year,
      buckets: series.buckets.map((bucket) => ({ label: bucket.label, count: bucket.count })),
    })),
  }
}

/** `viewIds` are the ids of the views sent, in the same order. */
export function fromHistogramResponse(
  response: HistogramResponse,
  viewIds: string[],
  columnKey: string,
  binWidth: number,
): Histogram {
  return {
    columnKey,
    binWidth,
    series: response.series.map((series) => ({
      viewId: viewIdAt(viewIds, series.view),
      bins: series.bins.map((bin) => ({ lowerBound: bin.lowerBound, count: bin.count })),
    })),
  }
}

function toChartViews(
  queries: ViewQuery[],
  columnKey: string,
  checkColumn: (column: Column) => string | null,
): { name: string; views: CountChartRequest['views'] } {
  const [first] = queries
  if (first === undefined) {
    throw new MappingError('Select at least one view.')
  }
  if (queries.length > MAX_CHART_VIEWS) {
    throw new MappingError(`At most ${MAX_CHART_VIEWS} views can be compared at the same time.`)
  }

  const name = new ColumnNames(first.columns).nameOf(columnKey)

  const views = queries.map((query) => {
    const names = new ColumnNames(query.columns)
    const resolved = names.resolve(name)
    const column = resolved === null ? undefined : query.columns.find((c) => c.key === resolved.key)
    if (column === undefined) {
      throw new MappingError(`"${name}" is not a column in every selected view.`)
    }
    const error = checkColumn(column)
    if (error !== null) {
      throw new MappingError(error)
    }
    return toApiView(query, names)
  })

  return { name, views }
}

function viewIdAt(viewIds: string[], index: number): string {
  const viewId = viewIds[index]
  if (viewId === undefined) {
    throw new MappingError('The server returned a chart series for a view that was not requested.')
  }
  return viewId
}
