import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

/**
 * Middleware xác thực JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy access token'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    // Lấy thông tin user từ database (bao gồm role)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại'
      })
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: profile.role,
      full_name: profile.full_name
    }
    
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token đã hết hạn',
        code: 'TOKEN_EXPIRED'
      })
    }
    
    return res.status(401).json({
      success: false,
      message: 'Access token không hợp lệ'
    })
  }
}

/**
 * Middleware kiểm tra role của user
 * @param {string|string[]} allowedRoles - Role được phép (có thể là string hoặc array)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      })
    }

    const userRole = req.user.role
    const rolesArray = allowedRoles.flat() // Flatten array nếu truyền vào là array

    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập. Yêu cầu role: ${rolesArray.join(' hoặc ')}`
      })
    }

    next()
  }
}

// Export alias cho authenticate (backward compatibility)
export const authenticate = authenticateToken
