import { supabase } from '../config/supabase.js'
import pkg from 'nodemailer'
const { createTransport } = pkg

// ═══════════════════════════════════════════════════════════════════════════
// OTP HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tạo mã OTP 6 chữ số ngẫu nhiên
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Tạo transporter cho nodemailer
 */
function createMailTransporter() {
  // Sử dụng Gmail SMTP (hoặc service khác)
  return createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Email của bạn
      pass: process.env.EMAIL_PASSWORD // App password (không phải password thường)
    }
  })
}

/**
 * Gửi OTP qua email
 * @param {string} email - Email người nhận
 * @param {string} otpCode - Mã OTP
 * @param {string} purpose - Mục đích: 'email_verification', 'password_reset'
 */
export async function sendOTPEmail(email, otpCode, purpose = 'email_verification') {
  try {
    // Kiểm tra cấu hình email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ EMAIL_USER hoặc EMAIL_PASSWORD chưa được cấu hình')
      return { success: false, error: 'Email chưa được cấu hình' }
    }
    
    const transporter = createMailTransporter()

    const purposeText = {
      email_verification: 'Xác thực email đăng ký',
      password_reset: 'Đặt lại mật khẩu'
    }

    const mailOptions = {
      from: `"Auction System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[Auction] Mã OTP ${purposeText[purpose] || 'xác thực'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">🔐 Mã OTP Xác Thực</h2>
          <p>Xin chào,</p>
          <p>Mã OTP của bạn để <strong>${purposeText[purpose]}</strong> là:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; letter-spacing: 8px; font-size: 36px; margin: 0;">${otpCode}</h1>
          </div>
          <p style="color: #ef4444; font-weight: bold;">⏰ Mã này sẽ hết hạn sau 10 phút.</p>
          <p style="color: #6b7280;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © 2025 Auction System. All rights reserved.
          </p>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ OTP email sent to ${email}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending OTP email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Lưu OTP vào database
 * @param {string} email - Email
 * @param {string} otpCode - Mã OTP
 * @param {string} purpose - Mục đích
 * @param {object} metadata - IP, user agent...
 */
export async function saveOTP(email, otpCode, purpose = 'email_verification', metadata = {}) {
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 phút

    const { data, error } = await supabase
      .from('otp_codes')
      .insert({
        email,
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt.toISOString(),
        ip_address: metadata.ip,
        user_agent: metadata.userAgent
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error saving OTP:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ OTP saved for ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Exception saving OTP:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify OTP
 * @param {string} email - Email
 * @param {string} otpCode - Mã OTP cần verify
 * @param {string} purpose - Mục đích
 */
export async function verifyOTP(email, otpCode, purpose = 'email_verification') {
  try {
    // Tìm OTP còn hạn và chưa verify
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .eq('purpose', purpose)
      .eq('is_verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.log('❌ Invalid or expired OTP')
      return { success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' }
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', data.id)

    if (updateError) {
      console.error('❌ Error updating OTP:', updateError)
      return { success: false, message: 'Lỗi khi xác thực OTP' }
    }

    console.log(`✅ OTP verified for ${email}`)
    return { success: true, message: 'Xác thực OTP thành công' }
  } catch (error) {
    console.error('❌ Exception verifying OTP:', error)
    return { success: false, message: 'Lỗi khi xác thực OTP' }
  }
}

/**
 * Xóa các OTP cũ/đã hết hạn của email
 * @param {string} email - Email
 */
export async function cleanupOldOTP(email) {
  try {
    const { error } = await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .or('is_verified.eq.true,expires_at.lt.' + new Date().toISOString())

    if (error) {
      console.error('❌ Error cleaning up OTP:', error)
    } else {
      console.log(`✅ Cleaned up old OTP for ${email}`)
    }
  } catch (error) {
    console.error('❌ Exception cleaning up OTP:', error)
  }
}
