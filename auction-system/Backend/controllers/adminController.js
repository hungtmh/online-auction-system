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
 * @desc    Lấy danh sách tất cả users (không bao gồm user đã bị soft delete)
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, include_deleted = 'false' } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Mặc định không hiển thị user đã bị xóa (soft delete)
    // Chỉ hiển thị nếu include_deleted = 'true'
    if (include_deleted !== 'true') {
      query = query.or('is_banned.eq.false,banned_reason.is.null')
    }

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

    // Chỉ cho phép 3 role: bidder, seller, admin (bỏ guest)
    if (!['bidder', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ. Chỉ cho phép: bidder, seller, admin'
      })
    }

    // Không cho phép tự thay đổi role của chính mình
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không thể thay đổi role của chính mình'
      })
    }

    // Kiểm tra role hiện tại của user
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Không cho phép thay đổi role của Admin
    if (currentUser?.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể thay đổi role của Admin'
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
    const { id } = req.params;

    // Không cho cấm chính mình
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không thể cấm chính mình',
      });
    }

    // Kiểm tra role của user trước khi cấm
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();

    if (userError) throw userError;

    // Không cho phép cấm Admin
    if (targetUser?.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể cấm tài khoản Admin',
      });
    }

    // Cấm user: đánh dấu is_banned = true (chỉ cấm Bidder và Seller)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_banned: true,
        banned_reason: 'Tài khoản đã bị cấm bởi Admin',
        banned_at: new Date().toISOString(),
        role: 'guest', // Hạ role về guest
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Đã cấm user thành công',
      data: data,
    });
  } catch (error) {
    console.error('❌ Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cấm user',
    });
  }
}

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa user (soft delete - đánh dấu is_banned = true)
 * @access  Private (Admin)
 * @note    Deprecated: Sử dụng banUser thay thế
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

    // Soft delete: đánh dấu user là đã xóa thay vì xóa thật
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_banned: true,
        banned_reason: 'Tài khoản đã bị xóa bởi Admin',
        banned_at: new Date().toISOString(),
        role: 'guest', // Hạ role về guest
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã xóa user (soft delete)',
      data: data
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
 * @route   POST /api/admin/users/:id/unban
 * @desc    Gỡ cấm user (hoàn tác cấm)
 * @access  Private (Admin)
 */
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params

    // Gỡ cấm: set is_banned = false
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_banned: false,
        banned_reason: null,
        banned_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã gỡ cấm user thành công',
      data: data
    })
  } catch (error) {
    console.error('❌ Error unbanning user:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể gỡ cấm user'
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
    console.log('📦 [Admin] Fetching products with status:', status || 'all');

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status); // Filter by status if provided
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching products:', error);
      throw error;
    }

    console.log(`✅ [Admin] Found ${data?.length || 0} products`);

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách sản phẩm',
      error: error.message
    });
  }
}

/**
 * @route   POST /api/admin/products/:id/approve
 * @desc    Duyệt sản phẩm (set status = approved)
 * @access  Private (Admin)
 */
export const approveProduct = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'approved',
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
        rejected_reason: reason || null,
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
 * @route   POST /api/admin/products/:id/cancel
 * @desc    Hủy sản phẩm (set status = cancelled, không xóa khỏi database)
 * @access  Private (Admin)
 */
export const cancelProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body || {}

    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'cancelled',
        rejected_reason: reason || 'Sản phẩm đã bị hủy bởi admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    res.json({
      success: true,
      message: 'Đã hủy sản phẩm',
      data: data
    })
  } catch (error) {
    console.error('❌ Error cancelling product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể hủy sản phẩm'
    })
  }
}

/**
 * @route   POST /api/admin/products/:id/uncancel
 * @desc    Gỡ hủy sản phẩm (set status = pending để admin duyệt lại)
 * @access  Private (Admin)
 */
export const uncancelProduct = async (req, res) => {
  try {
    const { id } = req.params

    // Kiểm tra sản phẩm có tồn tại và đang ở trạng thái cancelled không
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('id, status')
      .eq('id', id)
      .single()

    if (checkError) throw checkError

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    if (product.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không ở trạng thái đã hủy'
      })
    }

    // Gỡ hủy: set status về pending để admin có thể duyệt lại
    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'pending',
        rejected_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã gỡ hủy sản phẩm. Sản phẩm đã chuyển về trạng thái chờ duyệt.',
      data: data
    })
  } catch (error) {
    console.error('❌ Error uncancelling product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể gỡ hủy sản phẩm'
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

    let query = supabase
      .from('upgrade_requests')
      .select(`
        *,
        profiles!upgrade_requests_user_id_fkey (
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })

    // Nếu status !== 'all', mới filter theo status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

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
    // Tổng số users (không bao gồm banned users)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_banned', false)

    // Users đang online (đã login trong 15 phút gần đây - nếu có last_login field)
    // Hoặc đơn giản là 0 nếu không có tracking
    // TODO: Implement proper online tracking nếu có last_login hoặc session tracking
    const onlineUsers = 0

    // Tổng số sản phẩm (tất cả status)
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    // Sản phẩm đang approved (đã duyệt và đang hoạt động)
    const { count: activeProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')

    // Tổng số bids
    const { count: totalBids } = await supabase
      .from('bids')
      .select('id', { count: 'exact', head: true })

    // Tổng số danh mục sản phẩm (tất cả categories, không filter is_active)
    const { count: totalCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
    
    if (categoriesError) {
      console.error('❌ Error counting categories:', categoriesError)
    }

    // Yêu cầu nâng cấp pending
    const { count: pendingUpgrades } = await supabase
      .from('upgrade_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    console.log('📊 System Stats:', {
      totalUsers: totalUsers || 0,
      onlineUsers,
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalBids: totalBids || 0,
      totalCategories: totalCategories || 0,
      pendingUpgrades: pendingUpgrades || 0
    })

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        onlineUsers: onlineUsers || 0,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalBids: totalBids || 0,
        totalCategories: totalCategories || 0,
        pendingUpgrades: pendingUpgrades || 0
      }
    })
  } catch (error) {
    console.error('❌ Error getting system stats:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê',
      error: error.message
    })
  }
}

/**
 * @route   GET /api/admin/chart-data
 * @desc    Lấy dữ liệu biểu đồ 7 ngày gần nhất
 * @access  Private (Admin)
 */
export const getChartData = async (req, res) => {
  try {
    // Tính toán 7 ngày gần nhất (từ hôm nay về trước)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push(date)
    }

    // Khởi tạo mảng kết quả với 7 phần tử = 0
    const newUsers = new Array(7).fill(0)
    const newBids = new Array(7).fill(0)
    const spamReports = new Array(7).fill(0)

    // Lấy dữ liệu người dùng mới theo từng ngày
    for (let i = 0; i < days.length; i++) {
      const startDate = new Date(days[i])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(days[i])
      endDate.setHours(23, 59, 59, 999)

      // Đếm người dùng mới trong ngày
      const { count: userCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      newUsers[i] = userCount || 0

      // Đếm số bid mới trong ngày
      const { count: bidCount } = await supabase
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      newBids[i] = bidCount || 0

      // Đếm số báo cáo spam trong ngày
      const { count: spamCount } = await supabase
        .from('spam_reports')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      spamReports[i] = spamCount || 0
    }

    res.json({
      success: true,
      data: {
        newUsers,
        newBids,
        spamReports
      }
    })
  } catch (error) {
    console.error('❌ Error getting chart data:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy dữ liệu biểu đồ'
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
    // Admin cần xem TẤT CẢ categories để quản lý, không filter theo is_active
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, is_active')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching categories:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách categories',
        error: error.message,
      });
    }

    if (!categories || categories.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Lấy tất cả category IDs
    const categoryIds = categories.map(cat => cat.id);

    // Đếm số sản phẩm cho tất cả categories trong một query
    const { data: productCounts, error: countError } = await supabase
      .from('products')
      .select('category_id')
      .in('category_id', categoryIds);

    if (countError) {
      console.error('❌ Error counting products:', countError);
    }

    // Tạo map để đếm số sản phẩm theo category_id
    const countMap = {};
    if (productCounts) {
      productCounts.forEach(product => {
        const catId = product.category_id;
        countMap[catId] = (countMap[catId] || 0) + 1;
      });
    }

    // Gắn product_count vào mỗi category
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      product_count: countMap[cat.id] || 0
    }));

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi không mong muốn',
    });
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
        message: 'Thiếu thông tin bắt buộc: Tên danh mục và Slug là bắt buộc'
      })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug không hợp lệ. Chỉ cho phép chữ thường, số và dấu gạch ngang'
      })
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase error creating category:', error)
      
      // Handle duplicate slug
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(400).json({
          success: false,
          message: `Slug "${slug}" đã tồn tại. Vui lòng chọn slug khác.`
        })
      }
      
      // Handle other database errors
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể tạo category. Vui lòng thử lại.'
      })
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
      message: error.message || 'Không thể tạo category'
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
 * @desc    Xóa category (soft delete - đánh dấu is_active = false)
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    // Kiểm tra xem category có sản phẩm không
    const { count: productCount, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)

    if (countError) {
      console.error('❌ Error counting products:', countError)
      throw countError
    }

    // Không được xóa danh mục đã có sản phẩm
    if (productCount && productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì đang có ${productCount} sản phẩm. Vui lòng xóa hoặc chuyển các sản phẩm sang danh mục khác trước.`
      })
    }

    // Soft delete: đánh dấu category là không hoạt động thay vì xóa thật
    const { data, error } = await supabase
      .from('categories')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã xóa category (soft delete)',
      data: data
    })
  } catch (error) {
    console.error('❌ Error deleting category:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể xóa category'
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
    console.log('💰 [Admin] Fetching bid history, status:', status || 'all', 'page:', page);

    const { data, error } = await supabase
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
          status,
          winner_id,
          final_price,
          end_time
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Supabase error fetching bids:', error)
      throw error
    }

    console.log(`✅ [Admin] Found ${data?.length || 0} bids`)

    const computeStatus = (bid) => {
      const product = bid.product || {}

      if (bid.is_rejected) return 'cancelled'

      if (product.status === 'completed') {
        return product.winner_id === bid.bidder_id ? 'won' : 'lost'
      }

      if (product.status === 'cancelled') return 'cancelled'

      // If auction ended but winner not set yet, treat as pending result
      if (product.end_time && new Date(product.end_time) < new Date()) {
        return product.winner_id === bid.bidder_id ? 'won' : 'lost'
      }

      return 'active'
    }

    const normalizedData = (data || []).map((bid) => ({
      id: bid.id,
      product_id: bid.product_id,
      product_title: bid.product?.name || null,
      product_status: bid.product?.status || null,
      product_current_price: bid.product?.current_price || null,
      bidder_id: bid.bidder_id,
      bidder_name: bid.bidder?.full_name || null,
      bidder_email: bid.bidder?.email || null,
      amount: Number(bid.bid_amount ?? bid.amount ?? 0),
      max_bid_amount: Number(bid.max_bid_amount ?? 0) || null,
      created_at: bid.created_at,
      status: computeStatus(bid),
      is_auto_bid: bid.is_auto_bid,
      is_rejected: bid.is_rejected,
      rejected_at: bid.rejected_at
    }))

    const filteredData =
      status && status !== 'all'
        ? normalizedData.filter((bid) => bid.status === status)
        : normalizedData

    res.json({
      success: true,
      total: normalizedData.length,
      data: filteredData
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
 * @desc    Hủy bid (soft delete - đánh dấu is_rejected = true)
 * @access  Private (Admin)
 */
export const cancelBid = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    // Soft delete: đánh dấu bid là bị từ chối thay vì xóa thật
    const { data, error } = await supabase
      .from('bids')
      .update({ 
        is_rejected: true,
        rejected_at: new Date().toISOString()
        // Lưu ý: Nếu muốn lưu reason, cần thêm cột rejected_reason vào bảng bids
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    console.log(`🚫 Bid ${id} đã bị hủy. Lý do: ${reason || 'Không có'}`)

    res.json({
      success: true,
      message: 'Đã hủy bid (soft delete)',
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

/**
 * @route   GET /api/admin/settings
 * @desc    Lấy cài đặt hệ thống
 * @access  Private (Admin)
 */
export const getSystemSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;

    // Transform array rows => key/value pairs for easier consumption on FE
    const settings = data.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('❌ Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy cài đặt hệ thống'
    });
  }
};

/**
 * @route   PUT /api/admin/settings
 * @desc    Cập nhật cài đặt hệ thống
 * @access  Private (Admin)
 */
export const updateSystemSettings = async (req, res) => {
  try {
    const incomingSettings = req.body?.settings ?? req.body;

    if (!incomingSettings || typeof incomingSettings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Payload cài đặt không hợp lệ',
      });
    }

    // Debugging log for incoming settings
    console.log('🔍 Incoming settings payload:', incomingSettings);

    // Iterate over settings and update each row based on its key
    const updates = Object.entries(incomingSettings).map(async ([key, value]) => {
      try {
        const normalizedValue =
          value === null || value === undefined
            ? ''
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);

        console.log(`🔄 Updating setting: key=${key}, value=${normalizedValue}`);
        const { data, error } = await supabase
          .from('system_settings')
          .upsert(
            { key, value: normalizedValue, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
          .select()
          .single();

        if (error) {
          console.error(`❌ Error updating setting with key=${key}:`, error);
          throw error;
        }

        console.log(`✅ Successfully updated setting with key=${key}:`, data);
        return data;
      } catch (updateError) {
        console.error(`❌ Update failed for key=${key}:`, updateError);
        throw updateError;
      }
    });

    const updatedSettings = await Promise.all(updates);

    res.json({
      success: true,
      message: 'Cài đặt hệ thống đã được cập nhật',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('❌ Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật cài đặt hệ thống',
    });
  }
};

// ============================================
// SPAM MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/spam-reports
 * @desc    Lấy danh sách báo cáo spam
 * @access  Private (Admin)
 */
export const getSpamReports = async (req, res) => {
  try {
    const { status = 'pending', type, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    console.log('📋 getSpamReports params:', { status, type, page, limit, offset })

    // Thử query đơn giản trước để kiểm tra bảng có tồn tại không
    let query = supabase
      .from('spam_reports')
      .select(`
        *,
        reporter:profiles!reporter_id (
          id,
          full_name,
          email
        ),
        reported_user:profiles!reported_user_id (
          id,
          full_name,
          email,
          is_banned
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('report_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Supabase error getting spam reports:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log(`✅ Found ${data?.length || 0} spam reports`)

    // Đếm tổng số báo cáo theo status
    const { count: pendingCount } = await supabase
      .from('spam_reports')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    const { count: resolvedCount } = await supabase
      .from('spam_reports')
      .select('id', { count: 'exact' })
      .eq('status', 'resolved')

    const { count: dismissedCount } = await supabase
      .from('spam_reports')
      .select('id', { count: 'exact' })
      .eq('status', 'dismissed')

    res.json({
      success: true,
      data: data || [],
      stats: {
        pending: pendingCount || 0,
        resolved: resolvedCount || 0,
        dismissed: dismissedCount || 0,
        total: (pendingCount || 0) + (resolvedCount || 0) + (dismissedCount || 0)
      }
    })
  } catch (error) {
    console.error('❌ Error getting spam reports:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách báo cáo spam'
    })
  }
}

/**
 * @route   GET /api/admin/spam-reports/:id
 * @desc    Chi tiết báo cáo spam
 * @access  Private (Admin)
 */
export const getSpamReportById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('spam_reports')
      .select(`
        *,
        reporter:profiles!reporter_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        reported_user:profiles!reported_user_id (
          id,
          full_name,
          email,
          avatar_url,
          is_banned,
          role
        ),
        reviewed_by_user:profiles!reviewed_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo spam'
      })
    }

    // Nếu báo cáo liên quan đến product, lấy thông tin product
    let relatedProduct = null
    if (data.reported_product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, thumbnail_url, status, seller_id')
        .eq('id', data.reported_product_id)
        .single()
      relatedProduct = product
    }

    // Nếu báo cáo liên quan đến bid, lấy thông tin bid
    let relatedBid = null
    if (data.reported_bid_id) {
      const { data: bid } = await supabase
        .from('bids')
        .select('id, bid_amount, created_at, is_rejected')
        .eq('id', data.reported_bid_id)
        .single()
      relatedBid = bid
    }

    res.json({
      success: true,
      data: {
        ...data,
        related_product: relatedProduct,
        related_bid: relatedBid
      }
    })
  } catch (error) {
    console.error('❌ Error getting spam report:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin báo cáo spam'
    })
  }
}

/**
 * @route   POST /api/admin/spam-reports/:id/resolve
 * @desc    Xử lý báo cáo spam (xác nhận là spam)
 * @access  Private (Admin)
 */
export const resolveSpamReport = async (req, res) => {
  try {
    const { id } = req.params
    const { action, admin_note } = req.body
    // action: 'warn' | 'ban_user' | 'delete_content' | 'ban_and_delete'

    // Lấy thông tin báo cáo
    const { data: report, error: reportError } = await supabase
      .from('spam_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo spam'
      })
    }

    // Thực hiện action tương ứng
    if (action === 'ban_user' || action === 'ban_and_delete') {
      // Ban user đã bị báo cáo
      await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_reason: `Spam: ${report.reason || 'Vi phạm quy định'}`,
          banned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', report.reported_user_id)
    }

    if (action === 'delete_content' || action === 'ban_and_delete') {
      // Soft delete nội dung liên quan
      if (report.reported_product_id) {
        await supabase
          .from('products')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', report.reported_product_id)
      }

      if (report.reported_bid_id) {
        await supabase
          .from('bids')
          .update({
            is_rejected: true,
            rejected_at: new Date().toISOString()
          })
          .eq('id', report.reported_bid_id)
      }
    }

    // Cập nhật trạng thái báo cáo
    const { data, error } = await supabase
      .from('spam_reports')
      .update({
        status: 'resolved',
        action_taken: action,
        admin_note: admin_note || null,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã xử lý báo cáo spam',
      data: data
    })
  } catch (error) {
    console.error('❌ Error resolving spam report:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể xử lý báo cáo spam'
    })
  }
}

/**
 * @route   POST /api/admin/spam-reports/:id/dismiss
 * @desc    Bỏ qua báo cáo spam (không phải spam)
 * @access  Private (Admin)
 */
export const dismissSpamReport = async (req, res) => {
  try {
    const { id } = req.params
    const { admin_note } = req.body

    const { data, error } = await supabase
      .from('spam_reports')
      .update({
        status: 'dismissed',
        action_taken: 'dismissed',
        admin_note: admin_note || 'Báo cáo không hợp lệ hoặc không phải spam',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã bỏ qua báo cáo spam',
      data: data
    })
  } catch (error) {
    console.error('❌ Error dismissing spam report:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể bỏ qua báo cáo spam'
    })
  }
}

/**
 * @route   GET /api/admin/spam-stats
 * @desc    Thống kê spam
 * @access  Private (Admin)
 */
export const getSpamStats = async (req, res) => {
  try {
    // Đếm số báo cáo theo loại
    const { data: reportsByType, error: typeError } = await supabase
      .from('spam_reports')
      .select('report_type')

    if (typeError) throw typeError

    const typeStats = (reportsByType || []).reduce((acc, r) => {
      acc[r.report_type] = (acc[r.report_type] || 0) + 1
      return acc
    }, {})

    // Đếm user bị ban vì spam
    const { count: bannedForSpam } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('is_banned', true)
      .ilike('banned_reason', '%spam%')

    // Đếm báo cáo pending
    const { count: pendingReports } = await supabase
      .from('spam_reports')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    // Top users bị báo cáo nhiều nhất
    const { data: topReported, error: topError } = await supabase
      .from('spam_reports')
      .select(`
        reported_user_id,
        reported_user:profiles!reported_user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'resolved')

    if (topError) throw topError

    const reportedCounts = (topReported || []).reduce((acc, r) => {
      const userId = r.reported_user_id
      if (!acc[userId]) {
        acc[userId] = {
          user: r.reported_user,
          count: 0
        }
      }
      acc[userId].count++
      return acc
    }, {})

    const topReportedUsers = Object.values(reportedCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    res.json({
      success: true,
      stats: {
        pending_reports: pendingReports || 0,
        banned_for_spam: bannedForSpam || 0,
        by_type: typeStats,
        top_reported_users: topReportedUsers
      }
    })
  } catch (error) {
    console.error('❌ Error getting spam stats:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê spam'
    })
  }
}