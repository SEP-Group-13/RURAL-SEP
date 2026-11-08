import type { Request, Response } from 'express-serve-static-core'
import type { components } from '@shared/api/openapi.js'
import { ok } from '@/utils/httpResponse.js'

type Health = components['schemas']['Health']

export function getHealth(req: Request, res: Response) {
	const data: Health = { status: 'ok' }
	return ok(res, data)
}

