import express from 'express'
import { register, login, refresh, logout, getProfile, resendVerification } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.post('/resend-verification', resendVerification)
router.get('/profile', authenticate, getProfile)

export default router
