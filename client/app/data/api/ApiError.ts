import type { Problem } from './apiTypes'

/**
 * What went wrong, independent of HTTP details. UI code branches on this.
 *
 * - network:      the server could not be reached at all
 * - badRequest:   400, the request was malformed (a client bug)
 * - notFound:     404, the resource does not exist
 * - invalidQuery: 422, a value in the request is invalid (e.g. a formula); see `problem.errors`
 * - unavailable:  503, the server is up but its data source is not
 * - unknown:      any other failure
 */
export type ApiErrorKind = 'network' | 'badRequest' | 'notFound' | 'invalidQuery' | 'unavailable' | 'unknown'

export class ApiError extends Error {
  kind: ApiErrorKind

  /** HTTP status, or null when no response was received. */
  status: number | null

  /** The server's problem+json body, when it sent one. Branch on `problem.type`, never on `title`. */
  problem: Problem | null

  constructor(kind: ApiErrorKind, message: string, options: { status?: number | null; problem?: Problem | null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status ?? null
    this.problem = options.problem ?? null
  }
}

const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Could not reach the server. Check your network connection and try again.',
  badRequest: 'The request could not be understood by the server.',
  notFound: 'The requested item does not exist.',
  invalidQuery: 'Part of the request is invalid.',
  unavailable: 'The data source is currently unavailable. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
}

export function getErrorKindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'badRequest'
    case 404:
      return 'notFound'
    case 422:
      return 'invalidQuery'
    case 503:
      return 'unavailable'
    default:
      return 'unknown'
  }
}

/** Builds an ApiError from a failed HTTP response and its (possibly problem+json) body. */
export function createApiErrorFromResponse(response: Response, body: unknown): ApiError {
  const kind = getErrorKindForStatus(response.status)
  const problem = isProblem(body) ? body : null
  const message = problem?.detail ?? problem?.title ?? FALLBACK_MESSAGES[kind]
  return new ApiError(kind, message, { status: response.status, problem })
}

export function createNetworkError(): ApiError {
  return new ApiError('network', FALLBACK_MESSAGES.network)
}

/**
 * True for the error fetch throws when its request was aborted through an AbortSignal.
 * An abort is not a failure: the caller no longer wants the response, so nothing should be shown.
 * (Aborting with a custom reason makes fetch throw that reason instead; abort without one.)
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return FALLBACK_MESSAGES.unknown
}

function isProblem(body: unknown): body is Problem {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Problem).type === 'string' &&
    typeof (body as Problem).title === 'string'
  )
}
