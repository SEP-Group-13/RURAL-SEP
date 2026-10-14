import type { Response } from "express-serve-static-core"
import { cookieOptions } from "@/utils/jwt.js"

const payload = (data: unknown, redirect?: string) => {
  const payload = { data, redirect: '' }
  if (redirect) payload.redirect = redirect
  return payload
}

export const ok = (res: Response, data: unknown, redirect?: string) => {
  return res.status(200).json(payload(data, redirect))
}
export const created = (res: Response, data: unknown, redirect?: string) => {
  return res.status(201).json(payload(data, redirect))
}
export const noContent = (res: Response) => {
  return res.status(204).send()
}

export const attachAuthCookie = (res: Response, token: string) => {
  res.cookie('jwt', token, cookieOptions)
}
export const clearAuthCookie = (res: Response) => {
  res.clearCookie('jwt', cookieOptions)
}