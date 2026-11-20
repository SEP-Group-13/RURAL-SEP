import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import { toQueryParticipantsRequest } from '../api/mappers/view'
import type { ViewQuery } from '../types/view'
import { createDefaultViewSettings, getQueryFromSettings } from '../views/viewSettings'
import { buildRequest, failedRequest, startRequest } from './useDataRequest'
import type { LoadState } from './useDataRequest'

/** Collects the states startRequest reports, applying updater functions like React does. */
function stateRecorder<T>(initial: LoadState<T> = { status: 'loading', previousData: null }) {
  let current = initial
  const setState = vi.fn((next: LoadState<T> | ((previous: LoadState<T>) => LoadState<T>)) => {
    current = typeof next === 'function' ? next(current) : next
  })
  return { setState, get: () => current }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('startRequest', () => {
  it('reports loading with the previous data, then ready', async () => {
    const state = stateRecorder<string>({ status: 'ready', data: 'old' })
    const response = deferred<string>()

    startRequest(() => response.promise, state.setState)
    expect(state.get()).toEqual({ status: 'loading', previousData: 'old' })

    response.resolve('new')
    await flush()
    expect(state.get()).toEqual({ status: 'ready', data: 'new' })
  })

  it('reports an ApiError with its kind and message', async () => {
    const state = stateRecorder<string>()
    startRequest(() => Promise.reject(new ApiError('notFound', 'No participant with ID P1.')), state.setState)
    await flush()
    expect(state.get()).toEqual({ status: 'error', error: 'No participant with ID P1.', kind: 'notFound' })
  })

  it('reports an error thrown synchronously by run', async () => {
    const state = stateRecorder<string>()
    startRequest(() => {
      throw new Error('boom')
    }, state.setState)
    await flush()
    expect(state.get()).toEqual({ status: 'error', error: 'boom', kind: 'unknown' })
  })

  it('aborts the signal on cancel and ignores the late response', async () => {
    const state = stateRecorder<string>()
    const response = deferred<string>()
    let signal: AbortSignal | undefined

    const cancel = startRequest((s) => {
      signal = s
      return response.promise
    }, state.setState)
    cancel()
    expect(signal?.aborted).toBe(true)

    response.resolve('too late')
    await flush()
    expect(state.get()).toEqual({ status: 'loading', previousData: null })
  })

  it('does not report an abort as an error', async () => {
    const state = stateRecorder<string>()
    startRequest(() => Promise.reject(new DOMException('aborted', 'AbortError')), state.setState)
    await flush()
    expect(state.get().status).toBe('loading')
  })
})

describe('buildRequest', () => {
  it('runs with the body it built, keyed by that body', async () => {
    const run = vi.fn(async (body: { a: number }) => body.a * 2)
    const request = buildRequest(() => ({ a: 21 }), run)

    expect(request.key).toBe('{"a":21}')
    await expect(request.run(new AbortController().signal)).resolves.toBe(42)
  })

  it('turns a mapper error into a failed request that is never sent', async () => {
    const run = vi.fn()
    const request = buildRequest(() => {
      throw new Error('Select at least one year.')
    }, run)

    await expect(request.run(new AbortController().signal)).rejects.toThrow('Select at least one year.')
    expect(run).not.toHaveBeenCalled()
    expect(request.key).toBe(failedRequest(new Error('Select at least one year.')).key)
  })

  it('reports a mapper error as invalidQuery', async () => {
    const query: ViewQuery = { ...getQueryFromSettings(createDefaultViewSettings('V')), selectedYears: [] }
    const request = buildRequest(() => toQueryParticipantsRequest(query, 1, 25).body, vi.fn())
    const state = stateRecorder()

    startRequest(request.run, state.setState)
    await flush()
    expect(state.get()).toEqual({ status: 'error', error: 'Select at least one year.', kind: 'invalidQuery' })
  })
})

describe('participant page request keys', () => {
  const keyOf = (query: ViewQuery, page = 1) =>
    buildRequest(() => toQueryParticipantsRequest(query, page, 25).body, vi.fn()).key

  const base = getQueryFromSettings(createDefaultViewSettings('Default view'))

  it('stays the same when nothing the server needs changes', () => {
    const renamed = getQueryFromSettings(createDefaultViewSettings('Another name'))
    const visible = base.columns.filter((c) => c.visible)
    const hidden = base.columns.filter((c) => !c.visible)
    const hiddenReordered = { ...base, columns: [...visible, ...[...hidden].reverse()] }

    expect(hidden.length).toBeGreaterThan(1)
    expect(keyOf(renamed)).toBe(keyOf(base))
    expect(keyOf(hiddenReordered)).toBe(keyOf(base))
  })

  it('changes when a filter, the page or the sort changes', () => {
    const filtered: ViewQuery = { ...base, filters: [{ columnKey: 'sex', operator: 'in', value: ['Female'] }] }
    const sorted: ViewQuery = { ...base, sort: { columnKey: 'age', direction: 'asc' } }

    expect(keyOf(filtered)).not.toBe(keyOf(base))
    expect(keyOf(sorted)).not.toBe(keyOf(base))
    expect(keyOf(base, 2)).not.toBe(keyOf(base))
  })
})
