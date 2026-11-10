import createClient from 'openapi-fetch'
import { createApiErrorFromResponse, createNetworkError } from './ApiError'
import type { paths } from './apiTypes'

/** Matches `servers[0].url` in api/openapi/openapi.yaml. */
export const API_BASE_URL = '/api/v1'

/**
 * Typed HTTP client generated from the OpenAPI spec. Paths, parameters, request bodies and
 * responses are all checked against `shared/api/generated/api.d.ts` at compile time.
 */
export const http = createClient<paths>({ baseUrl: API_BASE_URL })

interface ClientResult<T> {
  data?: T
  error?: unknown
  response: Response
}

/**
 * Runs an openapi-fetch request and returns its data, or throws an ApiError.
 *
 *     const meta = await call(http.GET('/meta'))
 */
export async function call<T>(request: Promise<ClientResult<T>>): Promise<T> {
  let result: ClientResult<T>
  try {
    result = await request
  } catch {
    // fetch only rejects when no response arrived (offline, DNS, CORS, aborted)
    throw createNetworkError()
  }

  if (!result.response.ok) {
    throw createApiErrorFromResponse(result.response, result.error)
  }
  return result.data as T
}
