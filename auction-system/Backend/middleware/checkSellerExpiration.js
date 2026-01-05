/**
 * ============================================
 * SELLER EXPIRATION MIDDLEWARE
 * ============================================
 * Kiểm tra seller có còn quyền tạo sản phẩm không
 */

import { supabase } from '../config/supabase.js'

/**
 * Middleware kiểm tra seller expiration
 * Chỉ dùng cho route TẠO SẢN PHẨM
 */
export const checkSellerExpiration = async (req, res, next) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Lấy thông tin user
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, role, seller_expired_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check 1: Phải là seller
    if (user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create products',
        code: 'NOT_SELLER'
      })
    }

    // Check 2: Kiểm tra thời hạn
    const now = new Date()
    const expiredAt = user.seller_expired_at ? new Date(user.seller_expired_at) : null

    if (!expiredAt || now > expiredAt) {
      return res.status(403).json({
        success: false,
        message: 'Seller role expired. Please request extension.',
        code: 'SELLER_EXPIRED',
        expired_at: user.seller_expired_at
      })
    }

    // Thời hạn còn hiệu lực
    next()
  } catch (error) {
    console.error('❌ Error checking seller expiration:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
