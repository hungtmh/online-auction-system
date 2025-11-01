import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Cho phép gửi cookies
}))
app.use(express.json())
app.use(cookieParser()) // Parse cookies cho refresh token

// Routes
app.use('/api/auth', authRoutes)
app.use(express.urlencoded({ extended: true }))

// Routes
// TODO: Thêm routes cho products, bids, categories, etc.

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Auction Backend API is running!',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 AUCTION BACKEND API RUNNING                  ║
║   📍 http://localhost:${PORT}                       ║
║   🌍 Environment: ${process.env.NODE_ENV}          ║
║   🔗 Frontend: ${process.env.FRONTEND_URL}         ║
║   🔐 Auth: JWT + Refresh Token (HTTP-only cookie) ║
╚═══════════════════════════════════════════════════╝
  `)
})

export default app
