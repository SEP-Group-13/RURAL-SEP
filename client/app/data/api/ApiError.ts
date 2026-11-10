export type ApiErrorKind = 'network' | 'notFound' | 'invalidQuery'

export class ApiError extends Error {
  kind: ApiErrorKind

  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
