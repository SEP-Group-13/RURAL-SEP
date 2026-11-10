import type { Request, Response } from 'express-serve-static-core'
import { ok } from '@/utils/httpResponse.js'

// TODO: replace with the generated type once /health is in the spec (seewip/health-endpoint)
type Health = { status: 'ok' }


export function getHealth(req: Request, res: Response) {
	const data: Health = { status: 'ok' }
	return ok(res, data)
}

