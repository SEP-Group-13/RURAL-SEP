import type { z } from 'zod'
import { createApiErrorFromResponse, createNetworkError, isAbortError } from './ApiError'

/** Matches `servers[0].url` in api/openapi/openapi.yaml. */
export const API_BASE_URL = '/api'

export interface CallOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  query?: Record<string, string | number | undefined>
  signal?: AbortSignal
}

/**
 * Sends a request and validates the response against its schema from the OpenAPI spec
 * (`shared/api/generated/api.zod.ts`). Throws an ApiError on failure; an aborted request
 * rethrows the abort error unchanged, so callers can ignore it (`isAbortError`).
 *
 *     const meta = await call(GetMetaInfoResponse, '/meta/info', { signal })
 */
export async function call<S extends z.ZodType>(schema: S, path: string, options: CallOptions = {}): Promise<z.output<S>> {
  const response = await send(path, options)
  const body = await readJson(response)
  if (!response.ok) {
    throw createApiErrorFromResponse(response, body)
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    console.error(`Response of ${path} does not match the API spec`, result.error.issues)
    // A 2xx status maps to the 'unknown' kind with its generic message.
    throw createApiErrorFromResponse(response, null)
  }
  return result.data
}

async function send(path: string, { method = 'GET', body, query, signal }: CallOptions): Promise<Response> {
  // A Request (not a string), so test/setup.ts can resolve the relative URL in Node.
  const request = new Request(buildUrl(path, query), {
    method,
    signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  try {
    // Look fetch up per request (not once at startup), so the API mock in tests is used.
    return await globalThis.fetch(request)
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    // otherwise fetch only rejects when no response arrived (offline, DNS, CORS)
    throw createNetworkError()
  }
}

function buildUrl(path: string, query: CallOptions['query'] = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const search = params.toString()
  return `${API_BASE_URL}${path}${search ? `?${search}` : ''}`
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch (error) {
    if (isAbortError(error)) throw error // aborted while reading the body
    return null
  }
}
