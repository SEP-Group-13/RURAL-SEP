import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getErrorMessage } from '../api/ApiError'
import type { DataHandler } from '../participants/DataHandler'
import type { DatasetInfo } from '../types/dataset'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewSettings } from '../types/view'
import type { View } from '../views/View'
import type { ViewHandler, ViewHandlerState } from '../views/ViewHandler'
import type { ParticipantDetails } from '../types/participant'

export interface LoadingState<T> {
  status: 'loading'
  previousData: T | null
}

export interface ErrorState {
  status: 'error'
  error: string
}

export interface ReadyState<T> {
  status: 'ready'
  data: T
}

export type LoadState<T> = LoadingState<T> | ErrorState | ReadyState<T>

export interface LoadResult<T> {
  state: LoadState<T>
  retry: () => void
}

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

export function useViewPage(view: View, pageNumber: number): LoadResult<RowPage> {
  const settings = useViewSettings(view)
  const [state, setState] = useState<LoadState<RowPage>>({ status: 'loading', previousData: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => loadInto(view.getPage(pageNumber), setState), [view, settings, pageNumber, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

export function useViewRows(view: View): LoadResult<ViewRow[]> {
  const settings = useViewSettings(view)
  const [state, setState] = useState<LoadState<ViewRow[]>>({ status: 'loading', previousData: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => loadInto(view.getAllRows(), setState), [view, settings, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

export function useDatasetInfo(dataHandler: DataHandler): LoadResult<DatasetInfo> {
  const [state, setState] = useState<LoadState<DatasetInfo>>({ status: 'loading', previousData: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => loadInto(dataHandler.getDatasetInfo(), setState), [dataHandler, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

export function getLatestData<T>(state: LoadState<T>): T | null {
  if (state.status === 'ready') {
    return state.data
  }
  if (state.status === 'loading') {
    return state.previousData
  }
  return null
}

export function useParticipant(dataHandler: DataHandler, participantId: string): LoadResult<ParticipantDetails> {
  const [state, setState] = useState<LoadState<ParticipantDetails>>({ status: 'loading', previousData: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(
    () => loadInto(dataHandler.getParticipant(participantId), setState),
    [dataHandler, participantId, attempt],
  )

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

function loadInto<T>(request: Promise<T>, setState: Dispatch<SetStateAction<LoadState<T>>>): () => void {
  let ignore = false
  setState((current) => ({ status: 'loading', previousData: getLatestData(current) }))
  request.then(
    (data) => {
      if (!ignore) {
        setState({ status: 'ready', data })
      }
    },
    (error: unknown) => {
      if (!ignore) {
        setState({ status: 'error', error: getErrorMessage(error) })
      }
    },
  )
  return () => {
    ignore = true
  }
}
