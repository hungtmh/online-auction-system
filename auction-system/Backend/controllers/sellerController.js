/**
 * ============================================
 * SELLER CONTROLLER - CƯỜNG PHỤ TRÁCH
 * ============================================
 * Xử lý các tác vụ dành cho người bán:
 * - Đăng sản phẩm
 * - Quản lý sản phẩm của tôi
 * - Xem giá đấu
 * - Thống kê doanh thu
 */

import { supabase } from '../config/supabase.js'

/**
 * @route   POST /api/seller/products
 * @desc    Đăng sản phẩm mới
 * @access  Private (Seller)
 */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      starting_price,
      step_price,
      buy_now_price,
      end_time,
      image_url,
      auto_renew
    } = req.body

    const seller_id = req.user.id

    // Validate input
    if (!title || !category_id || !starting_price || !step_price || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      })
    }

    // Tạo sản phẩm
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id,
        title,
        category_id,
        starting_price,
        current_price: starting_price,
        step_price,
        buy_now_price,
        end_time,
        image_url,
        auto_renew: auto_renew || false,
        status: 'pending', // Chờ admin duyệt
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (productError) throw productError

    // Tạo product description
    if (description) {
      const { error: descError } = await supabase
        .from('product_descriptions')
        .insert({
          product_id: product.id,
          content: description
        })

      if (descError) console.error('Error creating description:', descError)
    }

    res.json({
      success: true,
      message: 'Đăng sản phẩm thành công, chờ admin duyệt',
      data: product
    })
  } catch (error) {
    console.error('❌ Error creating product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể tạo sản phẩm'
    })
  }
}

/**
 * @route   GET /api/seller/products
 * @desc    Lấy danh sách sản phẩm của tôi
 * @access  Private (Seller)
 */
export const getMyProducts = async (req, res) => {
  try {
    const seller_id = req.user.id
    const { status, page = 1, limit = 12 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        ),
        bids (count)
      `)
      .eq('seller_id', seller_id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Lọc theo status nếu có
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
    console.error('❌ Error getting my products:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách sản phẩm'
    })
  }
}

/**
 * @route   PUT /api/seller/products/:id
 * @desc    Cập nhật sản phẩm
 * @access  Private (Seller)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const seller_id = req.user.id
    const {
      title,
      description,
      category_id,
      starting_price,
      step_price,
      buy_now_price,
      end_time,
      image_url,
      auto_renew
    } = req.body

    // Kiểm tra sản phẩm có thuộc về seller này không
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('seller_id', seller_id)
      .single()

    if (checkError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm hoặc bạn không có quyền sửa'
      })
    }

    // Chỉ cho phép sửa khi status = pending hoặc chưa có bid
    if (product.status === 'active' && product.bid_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa sản phẩm đã có người đấu giá'
      })
    }

    // Update product
    const updateData = {}
    if (title) updateData.title = title
    if (category_id) updateData.category_id = category_id
    if (starting_price) updateData.starting_price = starting_price
    if (step_price) updateData.step_price = step_price
    if (buy_now_price) updateData.buy_now_price = buy_now_price
    if (end_time) updateData.end_time = end_time
    if (image_url) updateData.image_url = image_url
    if (auto_renew !== undefined) updateData.auto_renew = auto_renew
    updateData.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Update description nếu có
    if (description) {
      await supabase
        .from('product_descriptions')
        .upsert({
          product_id: id,
          content: description
        })
    }

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updated
    })
  } catch (error) {
    console.error('❌ Error updating product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật sản phẩm'
    })
  }
}

/**
 * @route   DELETE /api/seller/products/:id
 * @desc    Xóa sản phẩm
 * @access  Private (Seller)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    const seller_id = req.user.id

    // Kiểm tra quyền sở hữu
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('seller_id', seller_id)
      .single()

    if (checkError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    // Không cho xóa nếu đã có bid
    if (product.bid_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sản phẩm đã có người đấu giá'
      })
    }

    // Xóa sản phẩm
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
 * @route   GET /api/seller/products/:id/bids
 * @desc    Xem danh sách giá đấu của sản phẩm
 * @access  Private (Seller)
 */
export const getProductBids = async (req, res) => {
  try {
    const { id } = req.params
    const seller_id = req.user.id

    // Kiểm tra quyền sở hữu
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('seller_id', seller_id)
      .single()

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    // Lấy danh sách bids
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .eq('product_id', id)
  .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting product bids:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách giá đấu'
    })
  }
}

/**
 * @route   GET /api/seller/stats
 * @desc    Thống kê doanh thu
 * @access  Private (Seller)
 */
export const getSalesStats = async (req, res) => {
  try {
    const seller_id = req.user.id

    // Tổng số sản phẩm
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('seller_id', seller_id)

    // Sản phẩm đang active
    const { count: activeProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('seller_id', seller_id)
      .eq('status', 'active')

    // Sản phẩm đã bán (sold)
    const { count: soldProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('seller_id', seller_id)
      .eq('status', 'sold')

    // Tổng doanh thu (tổng current_price của sản phẩm sold)
    const { data: soldData } = await supabase
      .from('products')
      .select('current_price')
      .eq('seller_id', seller_id)
      .eq('status', 'sold')

    const totalRevenue = soldData?.reduce((sum, p) => sum + p.current_price, 0) || 0

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        soldProducts,
        totalRevenue
      }
    })
  } catch (error) {
    console.error('❌ Error getting sales stats:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê'
    })
  }
}
