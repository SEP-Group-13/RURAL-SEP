import { BadRequestError, DataUnvailableError, DatabaseError, DomainError, NotFoundError, ValidationError } from "@/types/error.types.js"
import type { NextFunction, Request, Response } from "express-serve-static-core"
import { env } from "process"
import { ZodError } from "zod"
import { badRequest, databaseError, internalServerError, invalidData, notFound, serviceUnavailable, unprocessableContent } from "@/utils/httpResponses.js"

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (env.NODE_ENV == 'development') {
    console.log(`[Error] ${err instanceof Error ? err.message : String(err)}`)
  }

  if (err instanceof NotFoundError) return notFound(res)
  if (err instanceof ValidationError) return unprocessableContent(res)
  if (err instanceof DatabaseError) return databaseError(res)
  if (err instanceof DataUnvailableError) return serviceUnavailable(res)

  if (err instanceof BadRequestError || err instanceof DomainError) {
    console.error(`[Unhandled DomainError] ${err.name}: ${err.message}`)
    return badRequest(res, err.message)
  }

  if (err instanceof ZodError) return invalidData(res)
  
  console.error(`[Unhandled Error] ${err instanceof Error ? err.stack || err.message : String(err)}`)
  return internalServerError(res)
}