import { DatabaseError, DomainError, EmailAlreadyInUseError, EventNotFoundError, InvalidCredentialsError, InvalidUserError, UnauthorizedError, UserNotFoundError, ValidationError } from "@/types/error.types.js"
import { newApiError } from "@shared/api/error.validator.js"
import type { NextFunction, Request, Response } from "express-serve-static-core"
import { env } from "process"
import { ZodError } from "zod"

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV == 'development') {
    console.log(`[Error] ${err instanceof Error ? err.message : String(err)}`)
  }

  if (err instanceof ValidationError) return res.status(400).json(newApiError('Invalid Data'))
  if (err instanceof EmailAlreadyInUseError) return res.status(400).json(newApiError('Email already in use'))
  if (err instanceof UserNotFoundError) return res.status(404).json(newApiError('User not found'))
  if (err instanceof InvalidCredentialsError) return res.status(400).json(newApiError('Invalid credentials'))
  if (err instanceof DatabaseError) return res.status(400).json(newApiError('Error fetching data'))
  if (err instanceof EventNotFoundError) return res.status(404).json(newApiError('Event not found'))
  if (err instanceof InvalidUserError) return res.status(401).json(newApiError('Your session expired, please log in again'))
  if (err instanceof UnauthorizedError) return res.status(403).json(newApiError('Unauthorized'))

  if (err instanceof DomainError) {
    console.error(`[Unhandled DomainError] ${err.name}: ${err.message}`)
    return res.status(400).json(newApiError('Bad Request'))
  }

  if (err instanceof ZodError) return res.status(400).json(newApiError('Invalid Data'))
  
  console.error(`[Unhandled Error] ${err instanceof Error ? err.stack || err.message : String(err)}`)
  return res.status(500).json(newApiError("Internal Server Error"))
}