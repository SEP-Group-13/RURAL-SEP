/**
 * A view cannot be expressed as an API request (e.g. an empty category filter, which the spec does
 * not allow). The message is written for the end user, like ApiError's.
 */
export class MappingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MappingError'
  }
}
