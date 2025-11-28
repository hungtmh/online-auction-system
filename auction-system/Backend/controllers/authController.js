import { supabase } from '../config/supabase.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { generateOTP, sendOTPEmail, saveOTP, verifyOTP, cleanupOldOTP } from '../utils/otpHelper.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

function generateAccessToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

export const register = async (req, res) => {
  try {
    const { email, password, full_name, address } = req.body

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    // Kiểm tra email đã tồn tại chưa
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Email đã được đăng ký' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Tạo user với email confirmation = false (chưa verify)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Chưa verify, sẽ dùng OTP
      user_metadata: { full_name, password_hash: hashedPassword, address }
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        return res.status(400).json({ success: false, message: 'Email đã được đăng ký' })
      }
      return res.status(400).json({ success: false, message: error.message })
    }

    // Tạo/cập nhật profile trong database (dùng upsert vì trigger có thể đã tạo profile)
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name,
        address: address || null,
        role: 'bidder'
      }, {
        onConflict: 'id'
      })

    if (profileUpsertError) {
      console.error('❌ Error upserting profile:', profileUpsertError)
      // Xóa user đã tạo nếu upsert profile thất bại
      await supabase.auth.admin.deleteUser(data.user.id)
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi tạo tài khoản. Vui lòng thử lại.' 
      })
    }

    // ═══════════════════════════════════════════════════════════
    // GỬI OTP QUA EMAIL
    // ═══════════════════════════════════════════════════════════
    
    // Cleanup old OTP
    await cleanupOldOTP(email)
    
    // Tạo OTP mới
    const otpCode = generateOTP()
    
    // Lưu OTP vào database
    try {
      const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      }
      const saveOTPResult = await saveOTP(email, otpCode, 'email_verification', metadata)
      if (saveOTPResult && !saveOTPResult.success) {
        console.error('❌ Lỗi lưu OTP:', saveOTPResult.error)
        // Không block đăng ký, có thể gửi lại sau
      }
    } catch (otpError) {
      console.error('❌ Lỗi khi lưu OTP:', otpError)
      // Không block đăng ký, có thể gửi lại sau
    }
    
    // Gửi OTP qua email
    try {
      // Nếu không có cấu hình email, log OTP ra console để test
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️ EMAIL_USER hoặc EMAIL_PASSWORD chưa được cấu hình')
        console.log(`📧 OTP cho ${email}: ${otpCode}`)
        console.log('💡 Để gửi email thật, hãy thêm EMAIL_USER và EMAIL_PASSWORD vào .env')
      } else {
        const emailResult = await sendOTPEmail(email, otpCode, 'email_verification')
        
        if (!emailResult.success) {
          console.error('❌ Lỗi gửi OTP email:', emailResult.error)
          console.log(`📧 OTP cho ${email} (fallback): ${otpCode}`)
          // Không block đăng ký, có thể gửi lại sau
        } else {
          console.log(`✅ OTP sent to: ${email}`)
        }
      }
    } catch (emailError) {
      console.error('❌ Lỗi khi gửi email OTP:', emailError)
      console.log(`📧 OTP cho ${email} (fallback): ${otpCode}`)
      // Không block đăng ký, có thể gửi lại sau
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.',
      requireOTPVerification: true,
      email: email
    })
  } catch (error) {
    console.error('Register error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi server',
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' })
    }

    // Tìm user qua profiles table (tránh listUsers gây lỗi database)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }

    // Lấy thông tin auth user
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.id)
    
    if (authError || !authData.user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }

    const user = authData.user

    // Kiểm tra email đã verified chưa
    if (!user.email_confirmed_at) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.',
        requireEmailVerification: true
      })
    }

    const passwordHash = user.user_metadata?.password_hash
    if (!passwordHash) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      })
    }

    console.log('✅ User authenticated:', user.id, user.email)

    const accessToken = generateAccessToken(user.id, email)
    const refreshToken = generateRefreshToken(user.id)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      accessToken,
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: profile.full_name || user.user_metadata?.full_name,
        role: profile.role || 'bidder'
      }
    })
  } catch (error) {
    console.error('❌ Login error:', error.message)
    console.error('Stack:', error.stack)
    res.status(500).json({ success: false, message: 'Lỗi server', debug: error.message })
  }
}

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy refresh token' })
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    const { data: { user }, error } = await supabase.auth.admin.getUserById(decoded.userId)

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ' })
    }

    const newAccessToken = generateAccessToken(user.id, user.email)

    res.json({ success: true, accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' })
  }
}

export const logout = async (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Đăng xuất thành công' })
}

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' })
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name,
        role: profile?.role || 'bidder',
        avatar_url: profile?.avatar_url || null,
        rating_positive: profile?.rating_positive || 0,
        rating_negative: profile?.rating_negative || 0
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// Gửi lại email verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' })
    }

    // Tìm user qua profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại' })
    }

    // Lấy thông tin auth user
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.id)
    
    if (authError || !authData.user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại' })
    }

    const user = authData.user

    // Kiểm tra đã verified chưa
    if (user.email_confirmed_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được xác nhận rồi' 
      })
    }

    // ═══════════════════════════════════════════════════════════
    // GỬI LẠI OTP
    // ═══════════════════════════════════════════════════════════
    
    // Cleanup old OTP
    await cleanupOldOTP(email)
    
    // Tạo OTP mới
    const otpCode = generateOTP()
    
    // Lưu OTP
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    }
    await saveOTP(email, otpCode, 'email_verification', metadata)
    
    // Gửi OTP qua email
    const emailResult = await sendOTPEmail(email, otpCode, 'email_verification')
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể gửi email. Vui lòng thử lại sau.' 
      })
    }

    res.json({
      success: true,
      message: 'Mã OTP đã được gửi lại. Vui lòng kiểm tra hộp thư.'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ═══════════════════════════════════════════════════════════
// VERIFY OTP
// ═══════════════════════════════════════════════════════════
export const verifyOTPCode = async (req, res) => {
  try {
    const { email, otp_code } = req.body

    if (!email || !otp_code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' })
    }

    // Verify OTP
    const result = await verifyOTP(email, otp_code, 'email_verification')
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message })
    }

    // Tìm user và confirm email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profile) {
      // Update email_confirmed_at trong Supabase Auth
      await supabase.auth.admin.updateUserById(profile.id, {
        email_confirm: true
      })
      
      console.log(`✅ Email confirmed for: ${email}`)
    }

    res.json({
      success: true,
      message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay.'
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}
