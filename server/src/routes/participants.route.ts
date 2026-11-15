import { Router } from 'express'
import { queryParticipants } from '@/controllers/participants.controller.js'

const router = Router()
router.post('/query', queryParticipants)
export default router
