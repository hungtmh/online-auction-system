/**
 * ============================================
 * MAIL CONFIGURATION
 * ============================================
 * Cấu hình Nodemailer cho hệ thống gửi email
 */

import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Tạo transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Mail server connection failed:', error.message)
  } else {
    console.log('✅ Mail server ready to send messages')
  }
})

export default transporter
