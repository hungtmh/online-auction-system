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
    const { status } = req.query; // Get status from query params

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status); // Filter by status if provided
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách sản phẩm',
    });
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
        profiles!upgrade_requests_user_id_fkey (
          full_name,
          email,
          role
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

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

    // Cập nhật role của user thành 'seller'
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ 
        role: 'seller',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.user_id)

    if (roleError) throw roleError

    // Cập nhật status của request
    const { data, error } = await supabase
      .from('upgrade_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        updated_at: new Date().toISOString()
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
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        updated_at: new Date().toISOString()
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

// ============================================
// CATEGORY MANAGEMENT - BỔ SUNG MỚI
// ============================================

/**
 * @route   GET /api/admin/categories
 * @desc    Lấy danh sách tất cả categories
 * @access  Private (Admin)
 */
export const getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting categories:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách categories'
    })
  }
}

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Chi tiết category
 * @access  Private (Admin)
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params

    // Lấy category info + đếm số sản phẩm
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category không tồn tại'
      })
    }

    // Đếm số sản phẩm trong category
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('category_id', id)

    res.json({
      success: true,
      data: {
        ...category,
        product_count: productCount
      }
    })
  } catch (error) {
    console.error('❌ Error getting category:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin category'
    })
  }
}

/**
 * @route   POST /api/admin/categories
 * @desc    Tạo category mới
 * @access  Private (Admin)
 */
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, is_active } = req.body

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      })
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug,
        description,
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Duplicate slug
        return res.status(400).json({
          success: false,
          message: 'Slug đã tồn tại'
        })
      }
      throw error
    }

    res.status(201).json({
      success: true,
      message: 'Tạo category thành công',
      data: data
    })
  } catch (error) {
    console.error('❌ Error creating category:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể tạo category'
    })
  }
}

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Cập nhật category
 * @access  Private (Admin)
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, slug, description, is_active } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Slug đã tồn tại'
        })
      }
      throw error
    }

    res.json({
      success: true,
      message: 'Cập nhật category thành công',
      data: data
    })
  } catch (error) {
    console.error('❌ Error updating category:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật category'
    })
  }
}

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Xóa category (không được xóa nếu có sản phẩm)
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    // Kiểm tra xem có sản phẩm nào trong category không
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('category_id', id)

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa category này vì còn ${productCount} sản phẩm`
      })
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Xóa category thành công'
    })
  } catch (error) {
    console.error('❌ Error deleting category:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể xóa category'
    })
  }
}

// ============================================
// BID MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/bids
 * @desc    Lấy lịch sử đấu giá
 * @access  Private (Admin)
 */
export const getBidHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('bids')
      .select(`
        *,
        bidder:profiles!bidder_id (
          full_name,
          email
        ),
        product:products!product_id (
          name,
          current_price,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting bid history:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử đấu giá',
      error: error.message
    })
  }
}

/**
 * @route   POST /api/admin/bids/:id/cancel
 * @desc    Hủy bid (xử lý gian lận)
 * @access  Private (Admin)
 */
export const cancelBid = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('bids')
      .update({ 
        is_rejected: true,
        rejected_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã hủy bid',
      data: data
    })
  } catch (error) {
    console.error('❌ Error canceling bid:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể hủy bid'
    })
  }
}

/**
 * @route   POST /api/admin/bids/:id/resolve-dispute
 * @desc    Giải quyết tranh chấp bid
 * @access  Private (Admin)
 */
export const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params
    const { resolution } = req.body

    // TODO: Implement dispute resolution logic
    
    res.json({
      success: true,
      message: 'Đã giải quyết tranh chấp'
    })
  } catch (error) {
    console.error('❌ Error resolving dispute:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể giải quyết tranh chấp'
    })
  }
}
