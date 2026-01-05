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
import mailService from '../services/mailService.js'

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
        bids (count),
        winner:winner_id (
          id,
          full_name,
          email
        )
      `)
      .eq('seller_id', seller_id)
      .order('created_at', { ascending: false })

    // Apply pagination only if limit is NOT 'all'
    if (limit !== 'all') {
      query = query.range(offset, offset + limit - 1)
    }

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

    // KHÔNG cho phép sửa description gốc qua update
    // Chỉ cho phép bổ sung qua append_description
    if (append_description) {
      // Lưu vào bảng product_descriptions thay vì merge vào description gốc
      const { error: appendError } = await supabase.from('product_descriptions').insert({
        product_id: id,
        description: append_description
      })

      if (appendError) {
        console.warn('⚠️  Không thể lưu bổ sung mô tả:', appendError.message)
        return res.status(500).json({ 
          success: false, 
          message: 'Không thể lưu bổ sung mô tả. Vui lòng thử lại.' 
        })
      }

      // Gửi email cho tất cả bidders
      const mailService = await import('../services/mailService.js')
      await mailService.notifyProductDescriptionUpdate({
        product: {
          id: product.id,
          name: product.name,
          thumbnail_url: product.thumbnail_url
        },
        newDescription: append_description
      })
    }

    if (Object.keys(updateData).length === 0 && !append_description) {
      return res.status(400).json({ success: false, message: 'Không có nội dung cần cập nhật.' })
    }

    // Chỉ update nếu có thay đổi khác ngoài description
    let updated = product
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString()

      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      updated = updatedProduct
    }

    res.json({
      success: true,
      message: append_description 
        ? 'Đã bổ sung mô tả mới thành công. Mô tả gốc được giữ nguyên.' 
        : 'Cập nhật sản phẩm thành công.',
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

    // Gửi email thông báo (sync for reliability)
    try {
      // Lấy thông tin đầy đủ product và seller
      const { data: fullProduct } = await supabase
        .from('products')
        .select('id, name, thumbnail_url')
        .eq('id', question.product_id)
        .single()

      const { data: seller } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', sellerId)
        .single()

      await mailService.notifyQuestionAnswered({
        product: fullProduct,
        seller,
        question: { ...updated, question: updated.question },
        answer: trimmedAnswer
      })
    } catch (emailError) {
      console.error('❌ Error sending question answered email:', emailError)
    }

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
      .select('id, seller_id, status, starting_price, step_price')
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

    // Lấy thông tin bid để biết ai bị reject
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('id, product_id, bidder_id, is_rejected')
      .eq('id', bidId)
      .eq('product_id', productId)
      .single()

    if (bidError || !bid) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lượt đấu giá.' })
    }

    const bidderToRejectId = bid.bidder_id

    // 1. Thêm vào bảng rejected_bidders (chặn bid sau này)
    const { data: existingReject } = await supabase
      .from('rejected_bidders')
      .select('id')
      .eq('product_id', productId)
      .eq('bidder_id', bidderToRejectId)
      .maybeSingle()

    if (!existingReject) {
      const { error: rejectInsertError } = await supabase
        .from('rejected_bidders')
        .insert({
          product_id: productId,
          bidder_id: bidderToRejectId,
          seller_id: sellerId,
          reason: req.body.reason || 'Người bán từ chối'
        })
      if (rejectInsertError) throw rejectInsertError
    }

    // 2. Mark ALL existing bids for this user/product as rejected
    const { error: updateBidsError } = await supabase
      .from('bids')
      .update({
        is_rejected: true,
        rejected_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('bidder_id', bidderToRejectId)

    if (updateBidsError) throw updateBidsError

    // 3. Recalculate price based on remaining valid bids
    // Strategy: Find Top 2 valid bidders
    const { data: remainingBids } = await supabase
      .from('bids')
      .select('max_bid_amount, bidder_id, created_at')
      .eq('product_id', productId)
      .eq('is_rejected', false)
      .order('max_bid_amount', { ascending: false })
      .order('created_at', { ascending: true }) // Earliest bid wins ties
      .limit(2)

    let newCurrentPrice = product.starting_price
    let newBidCount = 0

    // Count exact remaining valid bids
    const { count } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('is_rejected', false)

    newBidCount = count || 0

    if (remainingBids && remainingBids.length > 0) {
      const top1 = remainingBids[0]

      if (remainingBids.length >= 2) {
        // >= 2 valid bidders. Price determined by 2nd highest.
        const top2 = remainingBids[1]
        // Standard auto-bid logic: 2nd_bid_max + step.
        const potentialPrice = Number(top2.max_bid_amount) + Number(product.step_price)
        newCurrentPrice = Math.min(Number(top1.max_bid_amount), potentialPrice)
      } else {
        // Only 1 valid bidder left. Price resets to starting price.
        // (Or typically starting_price, unless reserve is met, but simpler here)
        newCurrentPrice = product.starting_price
      }
    }

    await supabase
      .from('products')
      .update({
        current_price: newCurrentPrice,
        bid_count: newBidCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    // Notify Rejected Bidder
    try {
      const { data: bidder } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', bidderToRejectId)
        .single()

      const { data: fullProduct } = await supabase
        .from('products')
        .select('id, name, thumbnail_url')
        .eq('id', productId)
        .single()

      if (bidder && fullProduct) {
        await mailService.notifyBidRejected({
          product: fullProduct,
          bidder,
          reason: req.body.reason || 'Người bán đã từ chối tham gia đấu giá của bạn'
        })
      }
    } catch (emailError) {
      console.error('❌ Error sending bid rejected email:', emailError)
    }

    return res.json({
      success: true,
      message: 'Đã chặn người mua và cập nhật lại giá sản phẩm.',
      meta: {
        new_bid_count: newBidCount,
        new_current_price: newCurrentPrice
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

    // 1. Check if rating exists (gracefully handle potential duplicates)
    // We select ALL matches to decide whether to update or insert
    const { data: existingRatings } = await supabase
      .from('ratings')
      .select('id, rating')
      .eq('product_id', id)
      .eq('from_user_id', sellerId)
      .eq('to_user_id', product.winner_id)

    let resultData = null

    if (existingRatings && existingRatings.length > 0) {
      // === UPDATE MODE ===
      // If duplicates exist, we update the first one.
      const existingId = existingRatings[0].id

      const { data: updated, error: updateError } = await supabase
        .from('ratings')
        .update({
          rating,
          comment: trimmedComment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingId)
        .select('id, rating, comment, created_at')
        .single()

      if (updateError) throw updateError
      resultData = updated
    } else {
      // === INSERT MODE ===
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
      resultData = inserted
    }

    // 2. RECALCULATE COUNTS (Source of Truth)
    // To ensure accuracy and fix any previous double-counting or sync issues, 
    // we query the actual count from the ratings table and force-update the profile.
    const userIdToUpdate = product.winner_id

    const [posRes, negRes] = await Promise.all([
      supabase
        .from('ratings')
        .select('id', { count: 'exact', head: true })
        .eq('to_user_id', userIdToUpdate)
        .eq('rating', 'positive'),
      supabase
        .from('ratings')
        .select('id', { count: 'exact', head: true })
        .eq('to_user_id', userIdToUpdate)
        .eq('rating', 'negative')
    ])

    const exactPositiveCount = posRes.count || 0
    const exactNegativeCount = negRes.count || 0

    // Force update profile with calculated counts
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        rating_positive: exactPositiveCount,
        rating_negative: exactNegativeCount
      })
      .eq('id', userIdToUpdate)

    if (profileError) {
      console.error('Failed to sync profile rating counts:', profileError)
      // Continue, as the primary action (rating) succeeded
    }

    res.json({ success: true, message: 'Đã gửi đánh giá thành công.', data: resultData })
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

// ============================================
// BIDDER PERMISSION REQUESTS
// ============================================

/**
 * @route   GET /api/seller/products/:productId/requests
 * @desc    Lấy danh sách yêu cầu xin phép đấu giá (cho sp này)
 * @access  Private (Seller)
 */
export const getBidRequests = async (req, res) => {
  try {
    const { productId } = req.params
    const sellerId = req.user.id

    // Check ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' })
    }

    // Get requests
    const { data: requests, error } = await supabase
      .from('product_allowed_bidders')
      .select(`
        id,
        status,
        created_at,
        bidder:bidder_id (
          id,
          full_name,
          email,
          rating_positive,
          rating_negative
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('❌ Error getting bid requests:', error)
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách yêu cầu' })
  }
}

/**
 * @route   POST /api/seller/requests/:requestId/approve
 * @desc    Phê duyệt/Từ chối yêu cầu
 * @access  Private (Seller)
 */
export const updateBidRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params
    const sellerId = req.user.id
    const { status } = req.body // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status không hợp lệ' })
    }

    // Check request ownership via product
    const { data: request, error: reqError } = await supabase
      .from('product_allowed_bidders')
      .select(`
        id, 
        product_id, 
        bidder_id,
        products!inner(id, name, thumbnail_url, seller_id),
        profiles!product_allowed_bidders_bidder_id_fkey(id, email, full_name)
      `)
      .eq('id', requestId)
      .single()

    if (reqError || !request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' })
    }

    if (request.products.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Không có quyền xử lý yêu cầu này' })
    }

    // Update
    const { error: updateError } = await supabase
      .from('product_allowed_bidders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (updateError) throw updateError

    // Gửi email cho bidder
    const product = {
      id: request.products.id,
      name: request.products.name,
      thumbnail_url: request.products.thumbnail_url
    }
    const bidder = request.profiles

    if (product && bidder) {
      const mailService = await import('../services/mailService.js')
      await mailService.notifyBidPermissionResponse({ product, bidder, status })
    }

    res.json({
      success: true,
      message: status === 'approved' ? 'Đã phê duyệt yêu cầu' : 'Đã từ chối yêu cầu'
    })
  } catch (error) {
    console.error('❌ Error updating bid request:', error)
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái' })
  }
}

/**
 * @route   GET /api/seller/ratings
 * @desc    Lấy danh sách đánh giá của seller
 * @access  Private (Seller)
 */
export const getMyRatings = async (req, res) => {
  try {
    const userId = req.user.id

    // Lấy tất cả ratings mà user nhận được
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        id,
        rating,
        comment,
        created_at,
        product_id,
        from_user_id,
        products!ratings_product_id_fkey (
          id,
          name,
          thumbnail_url
        ),
        rater:profiles!ratings_from_user_id_fkey (
          id,
          full_name
        )
      `)
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Phân loại ratings
    const positiveRatings = ratings?.filter(r => r.rating === 'positive') || []
    const negativeRatings = ratings?.filter(r => r.rating === 'negative') || []

    res.json({
      success: true,
      data: {
        all: ratings || [],
        positive: positiveRatings,
        negative: negativeRatings,
        summary: {
          total: ratings?.length || 0,
          positive: positiveRatings.length,
          negative: negativeRatings.length
        }
      }
    })
  } catch (error) {
    console.error('❌ Error getting ratings:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đánh giá'
    })
  }
}

/**
 * @route   GET /api/seller/expiration-status
 * @desc    Kiểm tra trạng thái hết hạn seller
 * @access  Private (Seller)
 */
export const getExpirationStatus = async (req, res) => {
  try {
    const sellerId = req.user.id

    const { data: seller, error } = await supabase
      .from('profiles')
      .select('id, role, seller_expired_at')
      .eq('id', sellerId)
      .single()

    if (error || !seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      })
    }

    const now = new Date()
    const expiredAt = seller.seller_expired_at ? new Date(seller.seller_expired_at) : null
    const isExpired = !expiredAt || now > expiredAt
    const daysRemaining = expiredAt && !isExpired 
      ? Math.ceil((expiredAt - now) / (1000 * 60 * 60 * 24))
      : 0

    res.json({
      success: true,
      data: {
        seller_expired_at: seller.seller_expired_at,
        is_expired: isExpired,
        days_remaining: daysRemaining,
        can_create_product: !isExpired
      }
    })
  } catch (error) {
    console.error('❌ Error getting expiration status:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra trạng thái'
    })
  }
}

/**
 * @route   POST /api/seller/extension-request
 * @desc    Tạo yêu cầu gia hạn quyền seller
 * @access  Private (Seller)
 */
export const requestExtension = async (req, res) => {
  try {
    const sellerId = req.user.id
    const { reason } = req.body

    // Kiểm tra role seller
    const { data: seller, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sellerId)
      .single()

    if (roleError || seller?.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ seller mới có thể yêu cầu gia hạn'
      })
    }

    // Kiểm tra xem đã có yêu cầu gia hạn pending chưa
    const { data: existingRequest, error: checkError } = await supabase
      .from('upgrade_requests')
      .select('*')
      .eq('user_id', sellerId)
      .eq('status', 'pending')
      .is('reviewed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có yêu cầu gia hạn đang chờ duyệt'
      })
    }

    // Tạo yêu cầu gia hạn mới
    const { data, error } = await supabase
      .from('upgrade_requests')
      .insert({
        user_id: sellerId,
        reason: reason || '',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã gửi yêu cầu gia hạn thành công',
      data
    })
  } catch (error) {
    console.error('❌ Error requesting extension:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể gửi yêu cầu gia hạn'
    })
  }
}
