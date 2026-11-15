import { Router } from 'express'
import { getColumns } from '@/controllers/meta.controller.js'

const router = Router()
router.get('/columns', getColumns)
export default router
