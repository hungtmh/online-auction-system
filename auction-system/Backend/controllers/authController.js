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

    // Tạo profile trong database
    await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      full_name,
      address: address || null,
      role: 'bidder'
    })

    // ═══════════════════════════════════════════════════════════
    // GỬI OTP QUA EMAIL
    // ═══════════════════════════════════════════════════════════
    
    // Cleanup old OTP
    await cleanupOldOTP(email)
    
    // Tạo OTP mới
    const otpCode = generateOTP()
    
    // Lưu OTP vào database
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    }
    await saveOTP(email, otpCode, 'email_verification', metadata)
    
    // Gửi OTP qua email
    const emailResult = await sendOTPEmail(email, otpCode, 'email_verification')
    
    if (!emailResult.success) {
      console.error('❌ Lỗi gửi OTP email:', emailResult.error)
      // Không block đăng ký, có thể gửi lại sau
    } else {
      console.log(`✅ OTP sent to: ${email}`)
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.',
      requireOTPVerification: true,
      email: email
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
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

    // ═══════════════════════════════════════════════════════════
    // KIỂM TRA MẬT KHẨU BẰNG BCRYPT
    // ═══════════════════════════════════════════════════════════
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
        phone: profile?.phone || null,
        address: profile?.address || null,
        date_of_birth: profile?.date_of_birth || null,
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

// ═══════════════════════════════════════════════════════════
// GET ACCOUNT TYPE - Kiểm tra loại tài khoản (TH1, TH2, TH3)
// ═══════════════════════════════════════════════════════════
export const getAccountType = async (req, res) => {
  try {
    const userId = req.user.userId
    
    const { data: authData, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error || !authData.user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    }

    const user = authData.user
    const hasPassword = !!user.user_metadata?.password_hash
    const hasGoogle = user.user_metadata?.provider === 'google' || !!user.user_metadata?.google_id
    
    let accountType = 'local' // TH2 - Chỉ có mật khẩu local
    
    if (hasGoogle && !hasPassword) {
      accountType = 'google_only' // TH1 - Chỉ Google, chưa có mật khẩu
    } else if (hasGoogle && hasPassword) {
      accountType = 'hybrid' // TH3 - Có cả Google và mật khẩu local
    }
    
    res.json({
      success: true,
      data: {
        accountType, // 'google_only' | 'local' | 'hybrid'
        hasPassword,
        hasGoogle,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Get account type error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ═══════════════════════════════════════════════════════════
// CHANGE PASSWORD - Đổi mật khẩu (TH2, TH3)
// ═══════════════════════════════════════════════════════════
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId
    const { old_password, new_password, confirm_password } = req.body

    // Validate input
    if (!new_password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu mới và xác nhận' })
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp' })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    }

    // Lấy thông tin user
    const { data: authData, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error || !authData.user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    }

    const user = authData.user
    const currentPasswordHash = user.user_metadata?.password_hash

    // Nếu tài khoản ĐÃ CÓ mật khẩu → bắt buộc kiểm tra mật khẩu cũ
    if (currentPasswordHash) {
      if (!old_password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại' })
      }

      const isOldPasswordValid = await bcrypt.compare(old_password, currentPasswordHash)
      if (!isOldPasswordValid) {
        return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' })
      }
    }

    // Hash mật khẩu mới bằng bcrypt
    const newPasswordHash = await bcrypt.hash(new_password, 10)

    // Cập nhật password_hash vào user_metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: new_password, // Supabase Auth cũng cần password
      user_metadata: {
        ...user.user_metadata,
        password_hash: newPasswordHash
      }
    })

    if (updateError) {
      console.error('Update password error:', updateError)
      return res.status(500).json({ success: false, message: 'Không thể cập nhật mật khẩu' })
    }

    console.log(`✅ Password changed for user: ${user.email}`)

    res.json({
      success: true,
      message: currentPasswordHash 
        ? 'Đổi mật khẩu thành công!' 
        : 'Tạo mật khẩu thành công! Bạn có thể đăng nhập bằng email và mật khẩu.'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ═══════════════════════════════════════════════════════════
// CREATE PASSWORD - Tạo mật khẩu cho tài khoản Google (TH1)
// ═══════════════════════════════════════════════════════════
export const createPassword = async (req, res) => {
  try {
    const userId = req.user.userId
    const { new_password, confirm_password } = req.body

    // Validate input
    if (!new_password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu mới và xác nhận' })
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp' })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    // Lấy thông tin user
    const { data: authData, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error || !authData.user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    }

    const user = authData.user

    // Kiểm tra đã có mật khẩu chưa
    if (user.user_metadata?.password_hash) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tài khoản đã có mật khẩu. Vui lòng sử dụng chức năng đổi mật khẩu.' 
      })
    }

    // Hash mật khẩu mới bằng bcrypt
    const newPasswordHash = await bcrypt.hash(new_password, 10)

    // Cập nhật password_hash vào user_metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: new_password, // Supabase Auth cũng cần password
      user_metadata: {
        ...user.user_metadata,
        password_hash: newPasswordHash
      }
    })

    if (updateError) {
      console.error('Create password error:', updateError)
      return res.status(500).json({ success: false, message: 'Không thể tạo mật khẩu' })
    }

    console.log(`✅ Password created for Google user: ${user.email}`)

    res.json({
      success: true,
      message: 'Tạo mật khẩu thành công! Bạn có thể đăng nhập bằng email và mật khẩu.'
    })
  } catch (error) {
    console.error('Create password error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ═══════════════════════════════════════════════════════════
// FORGOT PASSWORD - Gửi OTP đặt lại mật khẩu
// ═══════════════════════════════════════════════════════════
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email' })
    }

    // Kiểm tra email tồn tại
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Không tiết lộ email không tồn tại (bảo mật)
      return res.json({ 
        success: true, 
        message: 'Nếu email tồn tại, mã OTP sẽ được gửi đến hộp thư của bạn.' 
      })
    }

    // Cleanup old OTP
    await cleanupOldOTP(email)

    // Tạo OTP mới
    const otpCode = generateOTP()

    // Lưu OTP vào database
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    }
    await saveOTP(email, otpCode, 'password_reset', metadata)

    // Gửi OTP qua email
    const emailResult = await sendOTPEmail(email, otpCode, 'password_reset')

    if (!emailResult.success) {
      console.error('❌ Lỗi gửi OTP email:', emailResult.error)
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể gửi email. Vui lòng thử lại sau.' 
      })
    }

    console.log(`✅ Password reset OTP sent to: ${email}`)

    res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ═══════════════════════════════════════════════════════════
// VERIFY RESET OTP - Xác thực OTP đặt lại mật khẩu
// ═══════════════════════════════════════════════════════════
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp_code } = req.body

    if (!email || !otp_code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' })
    }

    // Verify OTP với purpose = 'password_reset'
    const result = await verifyOTP(email, otp_code, 'password_reset')

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message })
    }

    // Tạo reset token tạm thời (có hiệu lực 5 phút)
    const resetToken = jwt.sign(
      { email, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '5m' }
    )

    console.log(`✅ Reset OTP verified for: ${email}`)

    res.json({
      success: true,
      message: 'Xác thực OTP thành công!',
      resetToken // Token để dùng trong bước đặt mật khẩu mới
    })
  } catch (error) {
    console.error('Verify reset OTP error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ═══════════════════════════════════════════════════════════
// RESET PASSWORD - Đặt mật khẩu mới (sau khi verify OTP)
// ═══════════════════════════════════════════════════════════
export const resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' })
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp' })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    // Verify reset token
    let decoded
    try {
      decoded = jwt.verify(reset_token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.' })
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' })
    }

    const email = decoded.email

    // Tìm user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    }

    // Lấy thông tin auth user
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.id)

    if (authError || !authData.user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    }

    const user = authData.user

    // Hash mật khẩu mới bằng bcrypt
    const newPasswordHash = await bcrypt.hash(new_password, 10)

    // Cập nhật password
    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: new_password,
      user_metadata: {
        ...user.user_metadata,
        password_hash: newPasswordHash
      }
    })

    if (updateError) {
      console.error('Reset password error:', updateError)
      return res.status(500).json({ success: false, message: 'Không thể đặt lại mật khẩu' })
    }

    console.log(`✅ Password reset successful for: ${email}`)

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}
