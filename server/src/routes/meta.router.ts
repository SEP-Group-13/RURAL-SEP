import { burdenPresetsController, columnsController, infoController } from '@/controllers/meta.controller.js'
import express from 'express'

const router = express.Router()

router.get('/info', infoController)
router.get('/columns', columnsController)
router.get('/burden-presets', burdenPresetsController)

export default router