import type { ApiConsumer } from './api/ApiConsumer'
import { httpApi } from './api/HttpApi'
import { ChartHandler } from './charts/ChartHandler'
import { DataHandler } from './participants/DataHandler'
import type { RowSource } from './rowSources/RowSource'
import { ServerRowSource } from './rowSources/ServerRowSource'
import { addDemoViews } from './views/demoViews'
import { ViewHandler } from './views/ViewHandler'
import { createBrowserViewStorage } from './views/viewStorage'

/**
 * All data comes from /api/v1: the server computes rows and charts, the browser only sends view
 * settings and shows the results. In development the API mock answers (VITE_MOCK_API, app/mocks).
 */
export const api: ApiConsumer = httpApi

export const rowSource: RowSource = new ServerRowSource(api)

export const dataHandler = new DataHandler(api)

export const chartHandler = new ChartHandler(api)

const viewStorage = createBrowserViewStorage()
const isFirstVisit = viewStorage.loadOpenViews() === null

export const viewHandler = new ViewHandler(rowSource, viewStorage)

if (isFirstVisit) {
  addDemoViews(viewHandler)
}

export { ApiError, getErrorMessage, isAbortError } from './api/ApiError'
export { getCategoryOptions, isBandColumnEdited } from './columns/columnHelpers'
export { PREDEFINED_FORMULAS } from './columns/predefinedFormulas'
export { getPresetBands } from './columns/presetBands'
export { MAX_OPEN_VIEWS, PAGE_SIZE } from './config'
export { getFilterOperatorFor } from './pipeline/filters'
export { validateFormula } from './pipeline/formula'
export { buildRequest, failedRequest, getLatestData, requestKey, useDataRequest } from './react/useDataRequest'
export { MAX_CHART_VIEWS } from './api/mappers/charts'
export { bandCellKey } from './api/mappers/rows'
export { ChartHandler } from './charts/ChartHandler'
export {
  useChartCounts,
  useDatasetInfo,
  useHistogram,
  useParticipantDetails,
  useViewHandlerState,
  useViewPage,
  useViewSettings,
  useViewsSettings,
} from './react/useView'
export { View } from './views/View'
export { ViewHandler } from './views/ViewHandler'

export type { ApiErrorKind } from './api/ApiError'
export type { ApiConsumer, RequestOptions } from './api/ApiConsumer'
export type { PredefinedFormulaName } from './columns/predefinedFormulas'
export { DataHandler } from './participants/DataHandler'
export type { SearchResult, SearchResults } from './participants/DataHandler'
export type { DataRequest, LoadErrorKind, LoadResult, LoadState } from './react/useDataRequest'
export type { RowSource } from './rowSources/RowSource'
export type { Band, PresetBandName } from './types/band'
export type { BurdenPreset } from './types/burden'
export type { ChartBucket, ChartCounts, CountSeries, Histogram, HistogramBin, HistogramSeries } from './types/charts'
export type { Column, ColumnDataType, ColumnGroup, ColumnSource } from './types/column'
export type { DatasetInfo, DataSourceMode } from './types/dataset'
export type { CategoryFilter, Filter, FilterOperator, NumberRange, RangeFilter, TextFilter } from './types/filter'
export type {
  Activity,
  ContactField,
  ExamElementTime,
  Participant,
  ParticipantDetails,
  YearlyTotals,
} from './types/participant'
export type { ActionResult } from './types/result'
export type { CellValue, RowPage, ViewRow } from './types/rows'
export type { SortDirection, SortRule, ViewQuery, ViewSettings, YearSelection } from './types/view'
export type { ViewHandlerState } from './views/ViewHandler'
