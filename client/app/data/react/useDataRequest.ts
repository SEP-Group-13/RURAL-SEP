import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ApiError, getErrorMessage, isAbortError } from '../api/ApiError'
import type { ApiErrorKind } from '../api/ApiError'
import { MappingError } from '../api/mappers/MappingError'

/**
 * The shared way for components to get data from the API.
 *
 * A wrapper hook (see useView.ts) turns what the component needs into a `DataRequest`:
 *
 *     export function useThing(id: string): LoadResult<Thing> {
 *       return useDataRequest({ key: requestKey(['thing', id]), run: (signal) => dataHandler.getThing(id, { signal }) })
 *     }
 *
 * The request is sent again only when its `key` changes (or on `retry`). Build the key from the
 * API request body the mappers produce, so settings that do not change the request (a view's name,
 * the order of hidden columns) do not cause a new request. When the key changes before the
 * response arrives, the outdated request is aborted.
 *
 * Nothing is cached: the data lives in the calling component's state only.
 */
export interface DataRequest<T> {
  /** Identifies the request: equal keys mean an equal request. */
  key: string
  run: (signal: AbortSignal) => Promise<T>
}

/** Why a request failed. `invalidQuery` also covers requests the mappers refused to build. */
export type LoadErrorKind = ApiErrorKind

export interface LoadingState<T> {
  status: 'loading'
  /** The data shown before this request started, so the UI can keep showing it. */
  previousData: T | null
}

export interface ErrorState {
  status: 'error'
  /** Written for the end user. */
  error: string
  kind: LoadErrorKind
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

/** A stable key for a request, from its (JSON-serialisable) API request body or parameters. */
export function requestKey(value: unknown): string {
  return JSON.stringify(value)
}

/**
 * A request that fails without being sent, for example if a mapper could not build its body.
 * Its key comes from the error message, so fixing the input (a new key) sends the real request.
 */
export function failedRequest(error: unknown): DataRequest<never> {
  return {
    key: `failed:${getErrorMessage(error)}`,
    run: () => Promise.reject(error),
  }
}

/**
 * Builds a request whose key and body come from the same mapper call. When the mapper throws
 * (e.g. a MappingError for an empty category filter), the result is a `failedRequest`.
 */
export function buildRequest<B, T>(
  buildBody: () => B,
  run: (body: B, signal: AbortSignal) => Promise<T>,
): DataRequest<T> {
  let body: B
  try {
    body = buildBody()
  } catch (error) {
    return failedRequest(error)
  }
  return { key: requestKey(body), run: (signal) => run(body, signal) }
}

export function useDataRequest<T>(request: DataRequest<T>): LoadResult<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading', previousData: null })
  const [attempt, setAttempt] = useState(0)

  // Reads the latest `run` without making it a dependency: only the key decides when to refetch.
  const start = useEffectEvent(() => startRequest(request.run, setState))

  useEffect(() => start(), [request.key, attempt])

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

/**
 * Runs one request and reports its progress through `setState`. Returns a function that aborts
 * the request and drops its result; an abort is never reported as an error.
 */
export function startRequest<T>(
  run: (signal: AbortSignal) => Promise<T>,
  setState: Dispatch<SetStateAction<LoadState<T>>>,
): () => void {
  const controller = new AbortController()
  let cancelled = false

  setState((current) => ({ status: 'loading', previousData: getLatestData(current) }))

  let request: Promise<T>
  try {
    request = run(controller.signal)
  } catch (error) {
    request = Promise.reject(error)
  }

  request.then(
    (data) => {
      if (!cancelled) {
        setState({ status: 'ready', data })
      }
    },
    (error: unknown) => {
      if (!cancelled && !isAbortError(error)) {
        setState({ status: 'error', error: getErrorMessage(error), kind: getErrorKind(error) })
      }
    },
  )

  return () => {
    cancelled = true
    controller.abort()
  }
}

function getErrorKind(error: unknown): LoadErrorKind {
  if (error instanceof ApiError) {
    return error.kind
  }
  if (error instanceof MappingError) {
    return 'invalidQuery'
  }
  return 'unknown'
}
