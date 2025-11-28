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
import { getSystemSettingMap } from '../utils/systemSettings.js'
import { uploadBufferToProductBucket, uploadBufferToAvatarBucket } from '../utils/upload.js'

/**
 * @route   POST /api/seller/products
 * @desc    Đăng sản phẩm mới
 * @access  Private (Seller)
 */
export const createProduct = async (req, res) => {
  try {
    const seller_id = req.user.id
    const {
      name,
      description,
      category_id,
      starting_price,
      step_price,
      buy_now_price,
      start_time,
      end_time,
      images = [],
      allow_unrated_bidders = true,
      auto_extend = true,
      auto_extend_minutes,
      auto_extend_threshold,
      agreementAccepted
    } = req.body

    if (!agreementAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần xác nhận điều khoản trước khi đăng sản phẩm.'
      })
    }

    if (!name || !description || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm, mô tả và danh mục là bắt buộc.'
      })
    }

    if (!starting_price || !step_price || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Giá khởi điểm, bước giá và thời gian kết thúc là bắt buộc.'
      })
    }

    if (!Array.isArray(images) || images.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Cần tối thiểu 3 ảnh sản phẩm.'
      })
    }

    if (!images.every((url) => typeof url === 'string' && url.trim().length > 0)) {
      return res.status(400).json({ success: false, message: 'Định dạng ảnh không hợp lệ.' })
    }

    const startTimeValue = start_time ? new Date(start_time) : new Date()
    const endTimeValue = new Date(end_time)

    if (Number.isNaN(endTimeValue.getTime()) || endTimeValue <= new Date()) {
      return res.status(400).json({ success: false, message: 'Thời gian kết thúc phải nằm trong tương lai.' })
    }

    if (startTimeValue >= endTimeValue) {
      return res.status(400).json({ success: false, message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' })
    }

    const startPriceNumber = Number(starting_price)
    const stepPriceNumber = Number(step_price)
    const buyNowNumber = buy_now_price ? Number(buy_now_price) : null

    if (Number.isNaN(startPriceNumber) || startPriceNumber < 0) {
      return res.status(400).json({ success: false, message: 'Giá khởi điểm không hợp lệ.' })
    }

    if (Number.isNaN(stepPriceNumber) || stepPriceNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Bước giá phải lớn hơn 0.' })
    }

    if (buyNowNumber && buyNowNumber <= startPriceNumber) {
      return res.status(400).json({ success: false, message: 'Giá mua ngay phải lớn hơn giá khởi điểm.' })
    }

    const settings = await getSystemSettingMap(['auto_extend_minutes', 'auto_extend_threshold'])
    const parsedExtendMinutes = Number(auto_extend_minutes ?? settings.auto_extend_minutes ?? 10)
    const parsedExtendThreshold = Number(auto_extend_threshold ?? settings.auto_extend_threshold ?? 5)
    const resolvedExtendMinutes = Number.isNaN(parsedExtendMinutes) ? 10 : parsedExtendMinutes
    const resolvedExtendThreshold = Number.isNaN(parsedExtendThreshold) ? 5 : parsedExtendThreshold

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id,
        category_id,
        name,
        description,
        thumbnail_url: images[0],
        images,
        starting_price: startPriceNumber,
        step_price: stepPriceNumber,
        buy_now_price: buyNowNumber,
        current_price: startPriceNumber,
        start_time: startTimeValue.toISOString(),
        end_time: endTimeValue.toISOString(),
        allow_unrated_bidders,
        auto_extend,
        auto_extend_minutes: resolvedExtendMinutes,
        auto_extend_threshold: resolvedExtendThreshold,
        status: 'pending'
      })
      .select()
      .single()

    if (productError) throw productError

    const { error: descError } = await supabase.from('product_descriptions').insert({
      product_id: product.id,
      description
    })

    if (descError) {
      console.warn('⚠️  Không thể lưu lịch sử mô tả:', descError.message)
    }

    res.status(201).json({
      success: true,
      message: 'Đăng sản phẩm thành công, chờ admin duyệt.',
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
      name,
      category_id,
      starting_price,
      step_price,
      buy_now_price,
      end_time,
      images,
      allow_unrated_bidders,
      auto_extend,
      auto_extend_minutes,
      auto_extend_threshold,
      append_description
    } = req.body

    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('seller_id', seller_id)
      .single()

    if (checkError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm hoặc bạn không có quyền sửa.' })
    }

    const hasMutableChanges = Boolean(
      name ||
        category_id ||
        starting_price !== undefined ||
        step_price !== undefined ||
        buy_now_price !== undefined ||
        end_time ||
        Array.isArray(images) ||
        allow_unrated_bidders !== undefined ||
        auto_extend !== undefined ||
        auto_extend_minutes !== undefined ||
        auto_extend_threshold !== undefined
    )

    const isAppendOnly = Boolean(append_description && !hasMutableChanges)

    if (['completed', 'cancelled'].includes(product.status) && !isAppendOnly) {
      return res.status(400).json({ success: false, message: 'Không thể sửa sản phẩm đã hoàn tất hoặc bị hủy.' })
    }

    if (product.status === 'active' && product.bid_count > 0 && !isAppendOnly) {
      return res.status(400).json({ success: false, message: 'Không thể sửa sản phẩm đã có người đấu giá.' })
    }

    const updateData = {}

    if (name) updateData.name = name
    if (category_id) updateData.category_id = category_id

    if (starting_price !== undefined) {
      const startPriceNumber = Number(starting_price)
      if (Number.isNaN(startPriceNumber) || startPriceNumber < 0) {
        return res.status(400).json({ success: false, message: 'Giá khởi điểm không hợp lệ.' })
      }
      updateData.starting_price = startPriceNumber
    }

    if (step_price !== undefined) {
      const stepPriceNumber = Number(step_price)
      if (Number.isNaN(stepPriceNumber) || stepPriceNumber <= 0) {
        return res.status(400).json({ success: false, message: 'Bước giá phải lớn hơn 0.' })
      }
      updateData.step_price = stepPriceNumber
    }

    if (buy_now_price !== undefined) {
      const buyNowNumber = Number(buy_now_price)
      if (Number.isNaN(buyNowNumber) || buyNowNumber <= (updateData.starting_price ?? product.starting_price)) {
        return res.status(400).json({ success: false, message: 'Giá mua ngay phải lớn hơn giá khởi điểm.' })
      }
      updateData.buy_now_price = buyNowNumber
    }

    if (end_time) {
      const endTimeValue = new Date(end_time)
      if (Number.isNaN(endTimeValue.getTime()) || endTimeValue <= new Date(product.start_time)) {
        return res.status(400).json({ success: false, message: 'Thời gian kết thúc không hợp lệ.' })
      }
      updateData.end_time = endTimeValue.toISOString()
    }

    if (Array.isArray(images)) {
      if (images.length < 3) {
        return res.status(400).json({ success: false, message: 'Cần tối thiểu 3 ảnh sản phẩm.' })
      }
      updateData.images = images
      updateData.thumbnail_url = images[0]
    }

    if (allow_unrated_bidders !== undefined) updateData.allow_unrated_bidders = allow_unrated_bidders
    if (auto_extend !== undefined) updateData.auto_extend = auto_extend
    if (auto_extend_minutes !== undefined) {
      const minutes = Number(auto_extend_minutes)
      if (Number.isNaN(minutes) || minutes <= 0) {
        return res.status(400).json({ success: false, message: 'Số phút gia hạn phải lớn hơn 0.' })
      }
      updateData.auto_extend_minutes = minutes
    }

    if (auto_extend_threshold !== undefined) {
      const threshold = Number(auto_extend_threshold)
      if (Number.isNaN(threshold) || threshold <= 0) {
        return res.status(400).json({ success: false, message: 'Ngưỡng gia hạn phải lớn hơn 0.' })
      }
      updateData.auto_extend_threshold = threshold
    }

    let mergedDescription = product.description

    if (append_description) {
      mergedDescription = `${product.description}\n\n${append_description}`
      updateData.description = mergedDescription
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có nội dung cần cập nhật.' })
    }

    updateData.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    if (append_description) {
      const { error: appendError } = await supabase.from('product_descriptions').insert({
        product_id: id,
        description: append_description
      })

      if (appendError) {
        console.warn('⚠️  Không thể lưu bổ sung mô tả:', appendError.message)
      }
    }

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công.',
      data: updated,
      mergedDescription
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
      .eq('status', 'completed')

    // Tổng doanh thu (tổng current_price của sản phẩm sold)
    const { data: soldData } = await supabase
      .from('products')
      .select('current_price')
      .eq('seller_id', seller_id)
      .eq('status', 'completed')

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

export const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, rating_positive, rating_negative, role')
      .eq('id', sellerId)
      .single()

    if (error || !profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' })
    }

    res.json({ success: true, data: profile })
  } catch (error) {
    console.error('❌ Error getting seller profile:', error)
    res.status(500).json({ success: false, message: 'Không thể tải hồ sơ người bán.' })
  }
}

export const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id
    const { full_name } = req.body

    const trimmedName = full_name?.trim()
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Tên hiển thị không được bỏ trống.' })
    }

    const updates = {
      full_name: trimmedName,
      updated_at: new Date().toISOString()
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', sellerId)
      .select('id, email, full_name, avatar_url, rating_positive, rating_negative, role')
      .single()

    if (error) throw error

    try {
      await supabase.auth.admin.updateUserById(sellerId, {
        user_metadata: { full_name: trimmedName }
      })
    } catch (adminError) {
      console.warn('⚠️  Không thể đồng bộ tên với Supabase Auth:', adminError.message)
    }

    res.json({ success: true, message: 'Cập nhật hồ sơ thành công.', data: profile })
  } catch (error) {
    console.error('❌ Error updating seller profile:', error)
    res.status(500).json({ success: false, message: 'Không thể cập nhật hồ sơ.' })
  }
}

export const uploadSellerAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file cần upload.' })
    }

    const sellerId = req.user.id
    const { buffer, mimetype } = req.file

    const { publicUrl } = await uploadBufferToAvatarBucket({
      buffer,
      mimetype,
      userId: sellerId
    })

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', sellerId)

    if (error) throw error

    res.json({ success: true, data: { avatar_url: publicUrl } })
  } catch (error) {
    console.error('❌ Error uploading seller avatar:', error)
    res.status(500).json({ success: false, message: 'Không thể upload ảnh đại diện.' })
  }
}

export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file cần upload.' })
    }

    const { buffer, mimetype } = req.file
    const sellerId = req.user.id

    const { filePath, publicUrl } = await uploadBufferToProductBucket({
      buffer,
      mimetype,
      sellerId
    })

    res.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath
      }
    })
  } catch (error) {
    console.error('❌ Error uploading product image:', error)
    res.status(500).json({ success: false, message: 'Không thể upload ảnh.' })
  }
}
