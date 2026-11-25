import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, isAbortError } from './ApiError'
import { call } from './httpClient'

const abortError = () => new DOMException('The operation was aborted.', 'AbortError')

describe('call', () => {
  it('rethrows an abort unchanged instead of reporting a network error', async () => {
    const error = abortError()
    await expect(call(Promise.reject(error))).rejects.toBe(error)
  })

  it('turns other fetch failures into a network ApiError', async () => {
    const result = call(Promise.reject(new TypeError('Failed to fetch')))
    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ kind: 'network', status: null })
  })

  it('turns an error response into an ApiError with the problem body', async () => {
    const problem = { type: 'urn:problem:invalid-formula', title: 'Invalid formula', detail: 'Unknown column [X].' }
    const result = call(Promise.resolve({ error: problem, response: new Response(null, { status: 422 }) }))
    await expect(result).rejects.toMatchObject({ kind: 'invalidQuery', status: 422, message: 'Unknown column [X].', problem })
  })
})

describe('isAbortError', () => {
  it('recognises only abort errors', () => {
    expect(isAbortError(abortError())).toBe(true)
    expect(isAbortError(new TypeError('Failed to fetch'))).toBe(false)
    expect(isAbortError(new ApiError('network', 'offline'))).toBe(false)
    expect(isAbortError('AbortError')).toBe(false)
  })
})

describe('httpApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** The client looks fetch up per request, so stubbing it is enough (relative URLs: see test/setup.ts). */
  async function importWithFetch(fetch: (request: Request) => Promise<Response>) {
    vi.stubGlobal('fetch', vi.fn(fetch))
    return (await import('./HttpApi')).httpApi
  }

  it('passes the signal to fetch, and an abort rejects with the abort error', async () => {
    let received: AbortSignal | undefined
    const api = await importWithFetch(
      (request) =>
        new Promise((_, reject) => {
          received = request.signal
          request.signal.addEventListener('abort', () => reject(abortError()))
        }),
    )

    const controller = new AbortController()
    const pending = api.getMeta({ signal: controller.signal })
    await vi.waitFor(() => expect(received).toBeDefined())
    controller.abort()

    const error = await pending.catch((e: unknown) => e)
    expect(isAbortError(error)).toBe(true)
    expect(received?.aborted).toBe(true)
  })

  it('still works without options', async () => {
    const api = await importWithFetch(async () => Response.json({ columns: [] }))
    await expect(api.listColumns()).resolves.toEqual([])
  })
})
