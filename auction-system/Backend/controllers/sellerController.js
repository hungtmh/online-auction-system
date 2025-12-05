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
      // auto_extend đã được chuyển sang cài đặt hệ thống do Admin quản lý
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

    // Lấy cài đặt từ system_settings (do Admin quản lý)
    const settings = await getSystemSettingMap(['auto_extend_enabled', 'auto_extend_minutes', 'auto_extend_threshold', 'min_bid_increment_percent'])
    
    // Validate bước giá theo % giá khởi điểm
    const minBidIncrementPercent = Number(settings.min_bid_increment_percent) || 5
    const minStepPrice = Math.ceil(startPriceNumber * minBidIncrementPercent / 100)
    
    if (stepPriceNumber < minStepPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Bước giá phải tối thiểu ${minStepPrice.toLocaleString('vi-VN')} VND (${minBidIncrementPercent}% của giá khởi điểm).` 
      })
    }

    const autoExtendEnabled = settings.auto_extend_enabled === 'true' || settings.auto_extend_enabled === true
    const resolvedExtendMinutes = Number(settings.auto_extend_minutes) || 10
    const resolvedExtendThreshold = Number(settings.auto_extend_threshold) || 5

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
        auto_extend: autoExtendEnabled,  // Sử dụng cài đặt từ Admin
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
 * @route   POST /api/seller/questions/:questionId/answer
 * @desc    Trả lời câu hỏi của bidder
 * @access  Private (Seller)
 */
export const answerBidderQuestion = async (req, res) => {
  try {
    const { questionId } = req.params
    const sellerId = req.user.id
    const { answer } = req.body

    const trimmedAnswer = answer?.trim()
    if (!trimmedAnswer) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung trả lời.' })
    }

    if (trimmedAnswer.length < 3) {
      return res.status(400).json({ success: false, message: 'Câu trả lời cần ít nhất 3 ký tự.' })
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, product_id')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', question.product_id)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền trả lời câu hỏi này.' })
    }

    const updates = {
      answer: trimmedAnswer,
      answered_at: new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', questionId)
      .select('id, product_id, asker_id, question, answer, answered_at, created_at, profiles:asker_id ( full_name )')
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      message: 'Đã gửi trả lời cho bidder.',
      data: updated
    })
  } catch (error) {
    console.error('❌ Error answering bidder question:', error)
    res.status(500).json({ success: false, message: 'Không thể gửi trả lời cho câu hỏi này.' })
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
          id,
          full_name,
          email,
          rating_positive,
          rating_negative
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
 * @route   POST /api/seller/products/:productId/bids/:bidId/reject
 * @desc    Từ chối một lượt đấu giá
 * @access  Private (Seller)
 */
export const rejectBid = async (req, res) => {
  try {
    const { productId, bidId } = req.params
    const sellerId = req.user.id

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status, starting_price')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối lượt đấu giá này.' })
    }

    if (['completed', 'cancelled'].includes(product.status)) {
      return res.status(400).json({ success: false, message: 'Không thể thao tác trên sản phẩm đã kết thúc.' })
    }

    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('id, product_id, bidder_id, is_rejected')
      .eq('id', bidId)
      .eq('product_id', productId)
      .single()

    if (bidError || !bid) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lượt đấu giá.' })
    }

    if (bid.is_rejected) {
      return res.status(400).json({ success: false, message: 'Lượt đấu giá này đã bị từ chối trước đó.' })
    }

    const rejectionPayload = {
      is_rejected: true,
      rejected_at: new Date().toISOString()
    }

    const { data: updatedBid, error: updateError } = await supabase
      .from('bids')
      .update(rejectionPayload)
      .eq('id', bidId)
      .select(`
        id,
        bid_amount,
        max_bid_amount,
        created_at,
        bidder_id,
        product_id,
        is_rejected,
        rejected_at,
        profiles:bidder_id (
          id,
          full_name,
          rating_positive,
          rating_negative
        )
      `)
      .single()

    if (updateError) throw updateError

    const { data: activeBids, count: activeBidCount } = await supabase
      .from('bids')
      .select('bid_amount', { count: 'exact' })
      .eq('product_id', productId)
      .eq('is_rejected', false)
      .order('bid_amount', { ascending: false })
      .limit(1)

    const nextHighest = activeBids?.[0]?.bid_amount ?? product.starting_price ?? 0

    await supabase
      .from('products')
      .update({
        current_price: nextHighest,
        bid_count: activeBidCount ?? 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    res.json({
      success: true,
      message: 'Đã từ chối lượt đấu giá.',
      data: updatedBid,
      meta: {
        active_bid_count: activeBidCount ?? 0,
        current_price: nextHighest
      }
    })
  } catch (error) {
    console.error('❌ Error rejecting bid:', error)
    res.status(500).json({ success: false, message: 'Không thể từ chối lượt đấu giá.' })
  }
}

export const getWinnerSummary = async (req, res) => {
  try {
    const { id } = req.params
    const sellerId = req.user.id

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, name, status, final_price, current_price, starting_price, winner_id, end_time, buy_now_price')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem sản phẩm này.' })
    }

    if (!product.winner_id) {
      return res.status(400).json({ success: false, message: 'Sản phẩm chưa có người thắng cuộc.' })
    }

    const { data: winner } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, rating_positive, rating_negative')
      .eq('id', product.winner_id)
      .single()

    const { data: order } = await supabase
      .from('orders')
      .select('id, status, payment_proof_url, shipping_address, payment_confirmed_at, created_at, updated_at, cancelled_at, cancellation_reason')
      .eq('product_id', id)
      .maybeSingle()

    const { data: ratingHistory } = await supabase
      .from('ratings')
      .select('id, rating, comment, created_at')
      .eq('product_id', id)
      .eq('from_user_id', sellerId)
      .eq('to_user_id', product.winner_id)
      .order('created_at', { ascending: false })

    const latestRating = Array.isArray(ratingHistory) ? ratingHistory[0] || null : null

    res.json({
      success: true,
      data: {
        product,
        winner,
        order,
        rating: latestRating,
        rating_history: ratingHistory || []
      }
    })
  } catch (error) {
    console.error('❌ Error getting winner summary:', error)
    res.status(500).json({ success: false, message: 'Không thể tải thông tin người thắng.' })
  }
}

export const rateWinner = async (req, res) => {
  try {
    const { id } = req.params
    const sellerId = req.user.id
    const { rating, comment } = req.body

    if (!['positive', 'negative'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'Loại đánh giá không hợp lệ.' })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status, winner_id')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền đánh giá sản phẩm này.' })
    }

    if (!product.winner_id) {
      return res.status(400).json({ success: false, message: 'Sản phẩm chưa có người thắng cuộc.' })
    }

    if (!['completed', 'cancelled'].includes(product.status)) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể đánh giá sau khi đấu giá kết thúc.' })
    }

    const trimmedComment = comment?.trim() || null

    const { data: inserted, error: insertError } = await supabase
      .from('ratings')
      .insert({
        from_user_id: sellerId,
        to_user_id: product.winner_id,
        product_id: id,
        rating,
        comment: trimmedComment
      })
      .select('id, rating, comment, created_at')
      .single()

    if (insertError) throw insertError

    res.json({ success: true, message: 'Đã gửi đánh giá thành công.', data: inserted })
  } catch (error) {
    console.error('❌ Error rating winner:', error)
    res.status(500).json({ success: false, message: 'Không thể gửi đánh giá.' })
  }
}

export const cancelWinnerTransaction = async (req, res) => {
  try {
    const { id } = req.params
    const sellerId = req.user.id
    const reason = 'Người thắng không thanh toán'
    const nowIso = new Date().toISOString()

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status, winner_id, starting_price')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác sản phẩm này.' })
    }

    if (!product.winner_id) {
      return res.status(400).json({ success: false, message: 'Sản phẩm chưa có người thắng cuộc.' })
    }

    if (product.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể hủy giao dịch khi sản phẩm đã hoàn tất.' })
    }

    const { error: ratingError } = await supabase
      .from('ratings')
      .insert({
        from_user_id: sellerId,
        to_user_id: product.winner_id,
        product_id: id,
        rating: 'negative',
        comment: reason
      })

    if (ratingError) throw ratingError

    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_by: sellerId,
        cancelled_at: nowIso,
        cancellation_reason: reason
      })
      .eq('product_id', id)

    await supabase
      .from('products')
      .update({
        status: 'cancelled',
        updated_at: nowIso
      })
      .eq('id', id)

    res.json({ success: true, message: 'Đã hủy giao dịch và ghi nhận đánh giá tiêu cực.' })
  } catch (error) {
    console.error('❌ Error cancelling winner transaction:', error)
    res.status(500).json({ success: false, message: 'Không thể hủy giao dịch.' })
  }
}

export const reopenAuction = async (req, res) => {
  try {
    const { id } = req.params
    const sellerId = req.user.id
    const { new_end_time } = req.body || {}

    if (!new_end_time) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn thời điểm kết thúc mới.' })
    }

    const parsedEnd = new Date(new_end_time)
    if (Number.isNaN(parsedEnd.getTime()) || parsedEnd <= new Date()) {
      return res.status(400).json({ success: false, message: 'Thời điểm kết thúc mới không hợp lệ.' })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status, starting_price')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác sản phẩm này.' })
    }

    if (!['completed', 'cancelled'].includes(product.status)) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể mở lại đấu giá sau khi hoàn tất hoặc hủy.' })
    }

    const { data: ratingHistory, error: ratingHistoryError } = await supabase
      .from('ratings')
      .select('rating, comment')
      .eq('product_id', id)
      .eq('from_user_id', sellerId)

    if (ratingHistoryError) throw ratingHistoryError

    const allowReopenByRating =
      Array.isArray(ratingHistory) &&
      ratingHistory.length === 1 &&
      ratingHistory[0].rating === 'negative' &&
      (ratingHistory[0].comment || '').trim().toLowerCase() === 'người thắng không thanh toán'

    if (!allowReopenByRating) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ cho phép mở lại nếu sản phẩm chỉ có duy nhất một đánh giá tiêu cực với nội dung "Người thắng không thanh toán".'
      })
    }

    await supabase.from('bids').delete().eq('product_id', id)
    await supabase.from('orders').delete().eq('product_id', id)

    const nowIso = new Date().toISOString()

    await supabase
      .from('products')
      .update({
        status: 'active',
        current_price: product.starting_price,
        bid_count: 0,
        winner_id: null,
        final_price: null,
        start_time: nowIso,
        end_time: parsedEnd.toISOString(),
        updated_at: nowIso
      })
      .eq('id', id)

    res.json({ success: true, message: 'Đã mở lại phiên đấu giá.', data: { end_time: parsedEnd.toISOString() } })
  } catch (error) {
    console.error('❌ Error reopening auction:', error)
    res.status(500).json({ success: false, message: 'Không thể mở lại đấu giá.' })
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
