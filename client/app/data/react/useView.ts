import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { toApiView, toQueryParticipantsRequest } from '../api/mappers/view'
import { PAGE_SIZE } from '../config'
import type { DataHandler } from '../participants/DataHandler'
import type { DatasetInfo } from '../types/dataset'
import type { ParticipantDetails } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewSettings } from '../types/view'
import type { View } from '../views/View'
import type { ViewHandler, ViewHandlerState } from '../views/ViewHandler'
import { buildRequest, requestKey, useDataRequest } from './useDataRequest'
import type { LoadResult } from './useDataRequest'

// The data hooks below all go through useDataRequest; see that file for how to add one.
// TODO(Part C, C5): pass the signal on once DataHandler accepts it; until then an outdated
// dataset or participant request is ignored but not aborted.

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

/**
 * @deprecated Loads every row of the view. Replaced by useChartCounts / useHistogram in Part C (C4).
 */
export function useViewRows(view: View): LoadResult<ViewRow[]> {
  const settings = useViewSettings(view)
  const request = useMemo(
    () =>
      buildRequest(
        () => toApiView(view.toQuery()),
        () => view.getAllRows(),
      ),
    [view, settings],
  )
  return useDataRequest(request)
}

/** GET /meta + /columns: data source mode, years, contact fields and category values. */
export function useDatasetInfo(dataHandler: DataHandler): LoadResult<DatasetInfo> {
  return useDataRequest({ key: 'datasetInfo', run: () => dataHandler.getDatasetInfo() })
}

/** Profile, burden summary and activities of one participant. */
export function useParticipantDetails(dataHandler: DataHandler, participantId: string): LoadResult<ParticipantDetails> {
  return useDataRequest({
    key: requestKey(['participant', participantId]),
    run: () => dataHandler.getParticipant(participantId),
  })
}
