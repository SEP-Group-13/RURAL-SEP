import type { Request, Response } from 'express-serve-static-core'
import { ok } from '@/utils/httpResponse.js'

export function getHealth(req: Request, res: Response) {
	return ok(res, { status: 'ok' })
}

