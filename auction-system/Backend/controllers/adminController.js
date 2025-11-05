/**
 * ============================================
 * ADMIN CONTROLLER - THẮNG PHỤ TRÁCH
 * ============================================
 * Xử lý các tác vụ quản trị:
 * - Quản lý users
 * - Duyệt/xóa sản phẩm
 * - Xử lý yêu cầu nâng cấp
 * - Thống kê hệ thống
 */

import { supabase } from '../config/supabase.js'

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách tất cả users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Lọc theo role nếu có
    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách users'
    })
  }
}

/**
 * @route   GET /api/admin/users/:id
 * @desc    Lấy chi tiết user
 * @access  Private (Admin)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        products (count),
        bids (count)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      })
    }

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting user:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin user'
    })
  }
}

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Thay đổi role của user
 * @access  Private (Admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['guest', 'bidder', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      })
    }

    // Không cho phép tự thay đổi role của chính mình
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không thể thay đổi role của chính mình'
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Cập nhật role thành công',
      data: data
    })
  } catch (error) {
    console.error('❌ Error updating user role:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật role'
    })
  }
}

/**
 * @route   POST /api/admin/users/:id/ban
 * @desc    Cấm user (set role = guest hoặc xóa)
 * @access  Private (Admin)
 */
export const banUser = async (req, res) => {
  try {
    const { id } = req.params

    // Không cho ban chính mình
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không thể ban chính mình'
      })
    }

    // Set role về guest để vô hiệu hóa
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: 'guest',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã cấm user thành công',
      data: data
    })
  } catch (error) {
    console.error('❌ Error banning user:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể cấm user'
    })
  }
}

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa user
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Không cho xóa chính mình
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa chính mình'
      })
    }

    // Xóa user khỏi Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) throw authError

    res.json({
      success: true,
      message: 'Xóa user thành công'
    })
  } catch (error) {
    console.error('❌ Error deleting user:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể xóa user'
    })
  }
}

/**
 * @route   GET /api/admin/products
 * @desc    Lấy tất cả sản phẩm (cho admin duyệt/quản lý)
 * @access  Private (Admin)
 */
export const getAllProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('products')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        categories (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting products:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách sản phẩm'
    })
  }
}

/**
 * @route   POST /api/admin/products/:id/approve
 * @desc    Duyệt sản phẩm (set status = active)
 * @access  Private (Admin)
 */
export const approveProduct = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã duyệt sản phẩm',
      data: data
    })
  } catch (error) {
    console.error('❌ Error approving product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể duyệt sản phẩm'
    })
  }
}

/**
 * @route   POST /api/admin/products/:id/reject
 * @desc    Từ chối sản phẩm (set status = rejected)
 * @access  Private (Admin)
 */
export const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // TODO: Gửi email thông báo cho seller

    res.json({
      success: true,
      message: 'Đã từ chối sản phẩm',
      data: data
    })
  } catch (error) {
    console.error('❌ Error rejecting product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể từ chối sản phẩm'
    })
  }
}

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Xóa sản phẩm vi phạm
 * @access  Private (Admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    })
  } catch (error) {
    console.error('❌ Error deleting product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể xóa sản phẩm'
    })
  }
}

/**
 * @route   GET /api/admin/upgrades
 * @desc    Lấy danh sách yêu cầu nâng cấp
 * @access  Private (Admin)
 */
export const getUpgradeRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query

    const { data, error } = await supabase
      .from('upgrade_requests')
      .select(`
        *,
        profiles (
          full_name,
          email,
          role
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting upgrade requests:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy yêu cầu nâng cấp'
    })
  }
}

/**
 * @route   POST /api/admin/upgrades/:id/approve
 * @desc    Duyệt yêu cầu nâng cấp
 * @access  Private (Admin)
 */
export const approveUpgrade = async (req, res) => {
  try {
    const { id } = req.params

    // Lấy thông tin upgrade request
    const { data: request, error: reqError } = await supabase
      .from('upgrade_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (reqError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      })
    }

    // Cập nhật role của user
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ 
        role: request.requested_role,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.user_id)

    if (roleError) throw roleError

    // Cập nhật status của request
    const { data, error } = await supabase
      .from('upgrade_requests')
      .update({ 
        status: 'approved',
        processed_at: new Date().toISOString(),
        processed_by: req.user.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã duyệt yêu cầu nâng cấp',
      data: data
    })
  } catch (error) {
    console.error('❌ Error approving upgrade:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể duyệt yêu cầu'
    })
  }
}

/**
 * @route   POST /api/admin/upgrades/:id/reject
 * @desc    Từ chối yêu cầu nâng cấp
 * @access  Private (Admin)
 */
export const rejectUpgrade = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('upgrade_requests')
      .update({ 
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: req.user.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã từ chối yêu cầu nâng cấp',
      data: data
    })
  } catch (error) {
    console.error('❌ Error rejecting upgrade:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể từ chối yêu cầu'
    })
  }
}

/**
 * @route   GET /api/admin/stats
 * @desc    Thống kê hệ thống
 * @access  Private (Admin)
 */
export const getSystemStats = async (req, res) => {
  try {
    // Tổng số users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })

    // Tổng số sản phẩm
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })

    // Sản phẩm đang active
    const { count: activeProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    // Tổng số bids
    const { count: totalBids } = await supabase
      .from('bids')
      .select('id', { count: 'exact' })

    // Yêu cầu nâng cấp pending
    const { count: pendingUpgrades } = await supabase
      .from('upgrade_requests')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        activeProducts,
        totalBids,
        pendingUpgrades
      }
    })
  } catch (error) {
    console.error('❌ Error getting system stats:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê'
    })
  }
}
