import type { Request, Response } from 'express'
import { asyncHandler } from '@/utils/asyncHandler.js'
import { ok } from '@/utils/httpResponses.js'
import { burdenPresetsService, columnsService, infoService } from '@/services/meta.service.js'

export const infoController = asyncHandler(async (req: Request, res: Response) => {
  const { info } = await infoService()
  return ok(res, info)
})

export const columnsController = asyncHandler(async (req: Request, res: Response) => {
  const { columns } = await columnsService()
  return ok(res, columns)
})

export const burdenPresetsController = asyncHandler(async (req: Request, res: Response) => {
  const { burdenPresets } = await burdenPresetsService()
  return ok(res, burdenPresets)
})