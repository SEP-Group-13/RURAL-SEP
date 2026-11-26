import type { Response } from "express-serve-static-core"

export const ok = <T>(res: Response, data: T) => {
  return res.status(200).json(data)
}

export const noContent = (res: Response) => {
  return res.status(204).send()
}

export const badRequest = (res: Response, detail: string) => res.status(400).type('application/problem+json').json({
  type: 'urn:problem:bad-request',
  title: 'Bad Request',
  detail
})

export const invalidData = (res: Response) => res.status(400).type('application/problem+json').json({
  type: 'urn:problem:invalid-data',
  title: 'Invalid Data',
  detail: 'The provided data is invalid.'
})

export const notFound = (res: Response) => res.status(404).type('application/problem+json').json({
  type: 'urn:problem:not-found',
  title: 'Not Found',
  detail: 'The requested resource was not found.'
})

export const unprocessableContent = (res: Response) => res.status(422).type('application/problem+json').json({
  type: 'urn:problem:unprocessable-content',
  title: 'Unprocessable Content',
  detail: 'The provided data is invalid.'
})

export const databaseError = (res: Response) => res.status(500).type('application/problem+json').json({
  type: 'urn:problem:database-error',
  title: 'Database Error',
  detail: 'An error occurred while accessing the database.'
})

export const internalServerError = (res: Response) => res.status(500).type('application/problem+json').json({
  type: 'urn:problem:internal-server-error',
  title: 'Internal Server Error',
  detail: 'An internal server error occurred.'
})

export const serviceUnavailable = (res: Response) => res.status(503).type('application/problem+json').json({
  type: 'urn:problem:data-unavailable',
  title: 'Data Unavailable',
  detail: 'The requested data is unavailable.'
})