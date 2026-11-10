import type { ApiConsumer } from './api/ApiConsumer'
import { mockApi } from './api/mockApi'
import { DataHandler } from './participants/DataHandler'
import { BrowserRowSource } from './rowSources/BrowserRowSource'
import type { RowSource } from './rowSources/RowSource'
import { addDemoViews } from './views/demoViews'
import { ViewHandler } from './views/ViewHandler'
import { createBrowserViewStorage } from './views/viewStorage'

export const api: ApiConsumer = mockApi

export const rowSource: RowSource = new BrowserRowSource(api)

export const dataHandler = new DataHandler(api, rowSource)

const viewStorage = createBrowserViewStorage()
const isFirstVisit = viewStorage.loadOpenViews() === null

export const viewHandler = new ViewHandler(rowSource, viewStorage)

if (isFirstVisit) {
  addDemoViews(viewHandler)
}

export { ApiError, getErrorMessage } from './api/ApiError'
export { mockApiControls } from './api/mockApi'
export { getCategoryOptions, isBandColumnEdited } from './columns/columnHelpers'
export { PREDEFINED_FORMULAS } from './columns/predefinedFormulas'
export { getPresetBands } from './columns/presetBands'
export { MAX_OPEN_VIEWS, PAGE_SIZE } from './config'
export { getFilterOperatorFor } from './pipeline/filters'
export { validateFormula } from './pipeline/formula'
export {
  getLatestData,
  useDatasetInfo,
  useViewHandlerState,
  useViewPage,
  useViewRows,
  useViewSettings,
} from './react/useView'
export { View } from './views/View'
export { ViewHandler } from './views/ViewHandler'

export type { ApiErrorKind } from './api/ApiError'
export type { ApiConsumer } from './api/ApiConsumer'
export type { PredefinedFormulaName } from './columns/predefinedFormulas'
export type { SearchResult } from './participants/DataHandler'
export type { LoadResult, LoadState } from './react/useView'
export type { RowSource } from './rowSources/RowSource'
export type { Band, PresetBandName } from './types/band'
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
