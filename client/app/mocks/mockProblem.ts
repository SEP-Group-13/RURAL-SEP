import type { Problem } from '../data/api/apiTypes'

/** An error response with an `application/problem+json` body. */
export class MockProblem extends Error {
  status: number
  problem: Problem

  constructor(status: number, problem: Problem) {
    super(problem.detail ?? problem.title)
    this.status = status
    this.problem = problem
  }
}

/** A 422 response pointing at the invalid part of the request. */
export function invalid(pointer: string, detail: string): MockProblem {
  return new MockProblem(422, {
    type: 'urn:problem:invalid-request',
    title: 'The request is invalid',
    detail,
    errors: [{ pointer, detail }],
  })
}
