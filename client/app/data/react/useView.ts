import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { toCountChartRequest, toHistogramRequest } from '../api/mappers/charts'
import { toQueryParticipantsRequest } from '../api/mappers/view'
import type { ChartHandler } from '../charts/ChartHandler'
import { PAGE_SIZE } from '../config'
import type { ChartCounts, Histogram } from '../types/charts'
import type { DataHandler } from '../participants/DataHandler'
import type { DatasetInfo } from '../types/dataset'
import type { ParticipantDetails } from '../types/participant'
import type { RowPage } from '../types/rows'
import type { ViewSettings } from '../types/view'
import type { View } from '../views/View'
import type { ViewHandler, ViewHandlerState } from '../views/ViewHandler'
import { buildRequest, requestKey, useDataRequest } from './useDataRequest'
import type { LoadResult } from './useDataRequest'

// The data hooks below all go through useDataRequest; see that file for how to add one.

export function useViewHandlerState(viewHandler: ViewHandler): ViewHandlerState {
  const subscribe = useCallback((listener: () => void) => viewHandler.subscribe(listener), [viewHandler])
  const getState = useCallback(() => viewHandler.getState(), [viewHandler])
  return useSyncExternalStore(subscribe, getState, getState)
}

export function useViewSettings(view: View): ViewSettings {
  const subscribe = useCallback((listener: () => void) => view.subscribe(listener), [view])
  const getSettings = useCallback(() => view.getSettings(), [view])
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}

/**
 * The settings of several views, updated when any of them changes. The result keeps its identity
 * while none of the settings changed, so it can be used as a dependency.
 */
export function useViewsSettings(views: View[]): ViewSettings[] {
  const viewsKey = views.map((view) => view.getId()).join('\n')
  // Callers often pass a new array each render ([view]); the views are identified by their ids.
  const stableViews = useMemo(() => views, [viewsKey])
  const cache = useRef<ViewSettings[]>([])

  const subscribe = useCallback(
    (listener: () => void) => {
      const stops = stableViews.map((view) => view.subscribe(listener))
      return () => stops.forEach((stop) => stop())
    },
    [stableViews],
  )
  const getSettings = useCallback(() => {
    const next = stableViews.map((view) => view.getSettings())
    const previous = cache.current
    if (next.length === previous.length && next.every((settings, i) => settings === previous[i])) {
      return previous
    }
    cache.current = next
    return next
  }, [stableViews])

  return useSyncExternalStore(subscribe, getSettings, getSettings)
}

/**
 * Participants per value of a category or band column, for one view or several (to compare them).
 * Refetches only when the POST /charts/counts body or the order of the views changes.
 */
export function useChartCounts(chartHandler: ChartHandler, views: View[], columnKey: string): LoadResult<ChartCounts> {
  const settings = useViewsSettings(views)
  const request = useMemo(
    () =>
      buildRequest(
        () => ({ viewIds: settings.map((s) => s.id), body: toCountChartRequest(settings, columnKey) }),
        (_body, signal) => chartHandler.getCounts(settings, columnKey, { signal }),
      ),
    [chartHandler, settings, columnKey],
  )
  return useDataRequest(request)
}

/**
 * Participants per bin of a numeric column, for one view or several (to compare them).
 * Refetches only when the POST /charts/histogram body or the order of the views changes.
 */
export function useHistogram(
  chartHandler: ChartHandler,
  views: View[],
  columnKey: string,
  binWidth: number,
): LoadResult<Histogram> {
  const settings = useViewsSettings(views)
  const request = useMemo(
    () =>
      buildRequest(
        () => ({ viewIds: settings.map((s) => s.id), body: toHistogramRequest(settings, columnKey, binWidth) }),
        (_body, signal) => chartHandler.getHistogram(settings, columnKey, binWidth, { signal }),
      ),
    [chartHandler, settings, columnKey, binWidth],
  )
  return useDataRequest(request)
}

/** One page of the participant table. Refetches only when the POST /participants/query body changes. */
export function useViewPage(view: View, pageNumber: number): LoadResult<RowPage> {
  const settings = useViewSettings(view)
  const request = useMemo(
    () =>
      buildRequest(
        () => toQueryParticipantsRequest(view.toQuery(), pageNumber, PAGE_SIZE).body,
        (_body, signal) => view.getPage(pageNumber, { signal }),
      ),
    [view, settings, pageNumber],
  )
  return useDataRequest(request)
}

/** GET /meta + /columns: data source mode, years, contact fields and category values. */
export function useDatasetInfo(dataHandler: Pick<DataHandler, 'getDatasetInfo'>): LoadResult<DatasetInfo> {
  return useDataRequest({ key: 'datasetInfo', run: (signal) => dataHandler.getDatasetInfo({ signal }) })
}

/** Profile, burden summary and activities of one participant. */
export function useParticipantDetails(
  dataHandler: Pick<DataHandler, 'getParticipant'>,
  participantId: string,
): LoadResult<ParticipantDetails> {
  return useDataRequest({
    key: requestKey(['participant', participantId]),
    run: (signal) => dataHandler.getParticipant(participantId, { signal }),
  })
}
