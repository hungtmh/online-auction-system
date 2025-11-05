import { supabase } from '../config/supabase.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = '15m'  // ← TEST: Token hết hạn sau 1 phút (production: '15m')
const REFRESH_TOKEN_EXPIRES_IN = '7d'

function generateAccessToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

export const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Tạo user với email confirmation bắt buộc
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,  // Bắt buộc xác nhận email
      user_metadata: { full_name, password_hash: hashedPassword }
    })

    if (error) {
      return res.status(400).json({ success: false, message: error.message })
    }

    // ═══════════════════════════════════════════════════════════
    // GỬI EMAIL VERIFICATION NGAY SAU KHI TẠO USER
    // ═══════════════════════════════════════════════════════════
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (resendError) {
        console.error('❌ Lỗi gửi email verification:', resendError.message)
      } else {
        console.log(`✅ Email verification đã gửi tới: ${email}`)
      }
    } catch (emailError) {
      console.error('❌ Lỗi gửi email:', emailError)
      // Không block việc đăng ký, email có thể gửi lại sau
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
      requireEmailVerification: true,
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

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      return res.status(500).json({ success: false, message: 'Lỗi server' })
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }

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
        message: 'Tài khoản chưa được thiết lập đúng. Vui lòng đăng ký lại.' 
      })
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
    }

    const accessToken = generateAccessToken(user.id, email)
    const refreshToken = generateRefreshToken(user.id)

    // Lấy role từ bảng profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

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
        full_name: user.user_metadata?.full_name,
        role: profile?.role || 'bidder'  // ← THÊM ROLE
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
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

    // Tìm user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      return res.status(500).json({ success: false, message: 'Lỗi server' })
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại' })
    }

    // Kiểm tra đã verified chưa
    if (user.email_confirmed_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được xác nhận rồi' 
      })
    }

    // Gửi lại verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (resendError) {
      console.error('Resend verification error:', resendError)
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể gửi email. Vui lòng thử lại sau.' 
      })
    }

    res.json({
      success: true,
      message: 'Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư.'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}
