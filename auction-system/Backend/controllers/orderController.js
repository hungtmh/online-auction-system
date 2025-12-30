/**
 * ============================================
 * ORDER CONTROLLER - Quản lý quy trình hoàn tất đơn hàng
 * ============================================
 * Flow 4 bước:
 * 1. Buyer cung cấp hoá đơn thanh toán + địa chỉ giao hàng
 * 2. Seller xác nhận đã nhận tiền + gửi hoá đơn vận chuyển
 * 3. Buyer xác nhận đã nhận hàng
 * 4. Cả 2 đánh giá chất lượng giao dịch
 */

import { supabase } from '../config/supabase.js'

// ============================================
// HELPER FUNCTIONS
// ============================================

const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const getOrderStep = (status) => {
  switch (status) {
    case ORDER_STATUS.PENDING_PAYMENT: return 1
    case ORDER_STATUS.PAYMENT_CONFIRMED: return 2
    case ORDER_STATUS.SHIPPED: return 2
    case ORDER_STATUS.DELIVERED: return 3
    case ORDER_STATUS.COMPLETED: return 4
    case ORDER_STATUS.CANCELLED: return 0
    default: return 1
  }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * @route   GET /api/orders/:productId
 * @desc    Lấy thông tin đơn hàng (cho cả buyer và seller)
 * @access  Private (Buyer/Seller của đơn hàng)
 */
export const getOrder = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user.id

    // Lấy product info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, thumbnail_url, current_price, final_price, status, winner_id, seller_id, end_time')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }

    // Kiểm tra quyền truy cập (chỉ seller hoặc winner)
    const isSeller = product.seller_id === userId
    const isBuyer = product.winner_id === userId

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' })
    }

    // Lấy order info
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()

    // Nếu chưa có order, tự động tạo
    if (!order && product.winner_id) {
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          product_id: productId,
          seller_id: product.seller_id,
          buyer_id: product.winner_id,
          final_price: product.final_price || product.current_price,
          status: ORDER_STATUS.PENDING_PAYMENT
        })
        .select()
        .single()

      if (createError) throw createError
      order = newOrder
    }

    // Lấy thông tin seller và buyer
    const [sellerRes, buyerRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, phone, address, rating_positive, rating_negative').eq('id', product.seller_id).single(),
      supabase.from('profiles').select('id, full_name, email, phone, address, rating_positive, rating_negative').eq('id', product.winner_id).single()
    ])

    // Lấy ratings của order này
    const { data: ratings } = await supabase
      .from('ratings')
      .select('id, from_user_id, to_user_id, rating, comment, created_at, updated_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    // Tìm rating của seller và buyer
    const sellerRating = ratings?.find(r => r.from_user_id === product.seller_id)
    const buyerRating = ratings?.find(r => r.from_user_id === product.winner_id)

    res.json({
      success: true,
      data: {
        product,
        order,
        seller: sellerRes.data,
        buyer: buyerRes.data,
        ratings: {
          sellerRating,
          buyerRating
        },
        currentStep: getOrderStep(order?.status),
        userRole: isSeller ? 'seller' : 'buyer'
      }
    })
  } catch (error) {
    console.error('❌ Error getting order:', error)
    res.status(500).json({ success: false, message: 'Không thể tải thông tin đơn hàng' })
  }
}

/**
 * @route   POST /api/orders/:productId/step1
 * @desc    Bước 1: Buyer cung cấp hoá đơn thanh toán + địa chỉ
 * @access  Private (Buyer)
 */
export const submitPaymentProof = async (req, res) => {
  try {
    const { productId } = req.params
    const buyerId = req.user.id
    const { shipping_address, payment_proof_url } = req.body

    if (!shipping_address?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ giao hàng' })
    }

    if (!payment_proof_url?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng upload hoá đơn thanh toán' })
    }

    // Kiểm tra order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products!inner(winner_id, seller_id)')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.buyer_id !== buyerId) {
      return res.status(403).json({ success: false, message: 'Bạn không phải người mua của đơn hàng này' })
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị huỷ' })
    }

    // Cập nhật order
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        shipping_address: shipping_address.trim(),
        payment_proof_url: payment_proof_url.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      message: 'Đã gửi thông tin thanh toán. Vui lòng chờ người bán xác nhận.',
      data: updated
    })
  } catch (error) {
    console.error('❌ Error submitting payment proof:', error)
    res.status(500).json({ success: false, message: 'Không thể gửi thông tin thanh toán' })
  }
}

/**
 * @route   POST /api/orders/:productId/step2
 * @desc    Bước 2: Seller xác nhận thanh toán HOẶC gửi hàng
 * @access  Private (Seller)
 */
export const confirmPaymentAndShip = async (req, res) => {
  try {
    const { productId } = req.params
    const sellerId = req.user.id
    const { confirm_payment, shipping_tracking_number, shipping_proof_url } = req.body

    // Kiểm tra order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không phải người bán của đơn hàng này' })
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị huỷ' })
    }

    if (!order.payment_proof_url) {
      return res.status(400).json({ success: false, message: 'Người mua chưa gửi hoá đơn thanh toán' })
    }

    const now = new Date().toISOString()

    // Nếu chỉ xác nhận thanh toán (chưa gửi hàng)
    if (confirm_payment && !order.payment_confirmed_at) {
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({
          status: ORDER_STATUS.PAYMENT_CONFIRMED,
          payment_confirmed_at: now,
          updated_at: now
        })
        .eq('id', order.id)
        .select()
        .single()

      if (updateError) throw updateError

      return res.json({
        success: true,
        message: 'Đã xác nhận thanh toán. Vui lòng nhập thông tin gửi hàng.',
        data: updated
      })
    }

    // Gửi hàng - cần có mã vận đơn
    if (!shipping_tracking_number?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã vận đơn' })
    }

    // Cập nhật order - gửi hàng
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.SHIPPED,
        payment_confirmed_at: order.payment_confirmed_at || now,
        shipped_at: now,
        shipping_tracking_number: shipping_tracking_number.trim(),
        shipping_proof_url: shipping_proof_url?.trim() || null,
        updated_at: now
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      message: 'Đã xác nhận thanh toán và gửi hàng. Chờ người mua xác nhận nhận hàng.',
      data: updated
    })
  } catch (error) {
    console.error('❌ Error confirming payment:', error)
    res.status(500).json({ success: false, message: 'Không thể xác nhận thanh toán' })
  }
}

/**
 * @route   POST /api/orders/:productId/step3
 * @desc    Bước 3: Buyer xác nhận đã nhận hàng
 * @access  Private (Buyer)
 */
export const confirmDelivery = async (req, res) => {
  try {
    const { productId } = req.params
    const buyerId = req.user.id

    // Kiểm tra order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.buyer_id !== buyerId) {
      return res.status(403).json({ success: false, message: 'Bạn không phải người mua của đơn hàng này' })
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị huỷ' })
    }

    if (order.status !== ORDER_STATUS.SHIPPED) {
      return res.status(400).json({ success: false, message: 'Đơn hàng chưa được gửi đi' })
    }

    const now = new Date().toISOString()

    // Cập nhật order
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.DELIVERED,
        delivered_at: now,
        buyer_confirmed_at: now,
        updated_at: now
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      message: 'Đã xác nhận nhận hàng thành công. Vui lòng đánh giá người bán.',
      data: updated
    })
  } catch (error) {
    console.error('❌ Error confirming delivery:', error)
    res.status(500).json({ success: false, message: 'Không thể xác nhận nhận hàng' })
  }
}

/**
 * @route   POST /api/orders/:productId/rate
 * @desc    Bước 4: Đánh giá chất lượng giao dịch (cho phép thay đổi)
 * @access  Private (Buyer/Seller)
 */
export const submitRating = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user.id
    const { rating, comment } = req.body

    if (!['positive', 'negative'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải là positive hoặc negative' })
    }

    // Kiểm tra order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    const isSeller = order.seller_id === userId
    const isBuyer = order.buyer_id === userId

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền đánh giá đơn hàng này' })
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Không thể đánh giá đơn hàng đã huỷ' })
    }

    const toUserId = isSeller ? order.buyer_id : order.seller_id
    const trimmedComment = comment?.trim() || null

    // Kiểm tra đã có rating chưa (fetch list to handle potential duplicates)
    const { data: existingRatings } = await supabase
      .from('ratings')
      .select('id, rating')
      .eq('product_id', productId)
      .eq('from_user_id', userId)
      .eq('to_user_id', toUserId)

    let savedRating

    if (existingRatings && existingRatings.length > 0) {
      // CẬP NHẬT rating (lấy cái đầu tiên nếu có nhiều)
      const existingRating = existingRatings[0]
      const oldRating = existingRating.rating

      const { data: updated, error: updateError } = await supabase
        .from('ratings')
        .update({
          rating,
          comment: trimmedComment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select()
        .single()

      if (updateError) throw updateError
      savedRating = updated

      // Recalculate counts (Source of Truth)
      // We calculate directly from the ratings table to ensure accuracy
      const [posRes, negRes] = await Promise.all([
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('to_user_id', toUserId).eq('rating', 'positive'),
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('to_user_id', toUserId).eq('rating', 'negative')
      ])

      const newPositive = posRes.count || 0
      const newNegative = negRes.count || 0

      // Update profile with exact counts
      await supabase.from('profiles').update({
        rating_positive: newPositive,
        rating_negative: newNegative
      }).eq('id', toUserId)

    } else {
      // TẠO rating mới
      const { data: inserted, error: insertError } = await supabase
        .from('ratings')
        .insert({
          from_user_id: userId,
          to_user_id: toUserId,
          product_id: productId,
          rating,
          comment: trimmedComment
        })
        .select()
        .single()

      if (insertError) throw insertError
      savedRating = inserted

      // Recalculate counts (Source of Truth)
      const [posRes, negRes] = await Promise.all([
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('to_user_id', toUserId).eq('rating', 'positive'),
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('to_user_id', toUserId).eq('rating', 'negative')
      ])

      const newPositive = posRes.count || 0
      const newNegative = negRes.count || 0

      // Update profile with exact counts
      await supabase.from('profiles').update({
        rating_positive: newPositive,
        rating_negative: newNegative
      }).eq('id', toUserId)
    }

    // Cập nhật flag đã rate
    const rateField = isSeller ? 'seller_rated' : 'buyer_rated'
    await supabase.from('orders').update({ [rateField]: true, updated_at: new Date().toISOString() }).eq('id', order.id)

    // Kiểm tra nếu cả 2 đã rate thì chuyển status = completed
    const { data: updatedOrder } = await supabase.from('orders').select('seller_rated, buyer_rated').eq('id', order.id).single()

    if (updatedOrder?.seller_rated && updatedOrder?.buyer_rated && order.status === ORDER_STATUS.DELIVERED) {
      await supabase.from('orders').update({ status: ORDER_STATUS.COMPLETED, updated_at: new Date().toISOString() }).eq('id', order.id)

      // Cập nhật product status
      await supabase.from('products').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', productId)
    }

    res.json({
      success: true,
      message: (existingRatings && existingRatings.length > 0) ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá thành công',
      data: savedRating
    })
  } catch (error) {
    console.error('❌ Error submitting rating:', error)
    res.status(500).json({ success: false, message: 'Không thể gửi đánh giá' })
  }
}

/**
 * @route   POST /api/orders/:productId/cancel
 * @desc    Seller huỷ giao dịch (kèm đánh giá -1 cho buyer)
 * @access  Private (Seller)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { productId } = req.params
    const sellerId = req.user.id
    const { reason } = req.body

    // Kiểm tra order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.seller_id !== sellerId) {
      return res.status(403).json({ success: false, message: 'Bạn không phải người bán của đơn hàng này' })
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị huỷ trước đó' })
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Không thể huỷ đơn hàng đã hoàn tất' })
    }

    // Chỉ cho phép huỷ khi buyer chưa thanh toán
    if (order.payment_proof_url) {
      return res.status(400).json({ success: false, message: 'Không thể huỷ đơn hàng khi người mua đã thanh toán' })
    }

    const now = new Date().toISOString()
    const cancelReason = reason?.trim() || 'Người bán huỷ giao dịch'

    // Cập nhật order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: ORDER_STATUS.CANCELLED,
        cancelled_by: sellerId,
        cancelled_at: now,
        cancellation_reason: cancelReason,
        updated_at: now
      })
      .eq('id', order.id)

    if (updateError) throw updateError

    // Tự động đánh giá -1 cho buyer
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('product_id', productId)
      .eq('from_user_id', sellerId)
      .eq('to_user_id', order.buyer_id)
      .maybeSingle()

    if (!existingRating) {
      await supabase.from('ratings').insert({
        from_user_id: sellerId,
        to_user_id: order.buyer_id,
        product_id: productId,
        rating: 'negative',
        comment: cancelReason
      })

      // Cập nhật điểm rating
      const { data: profile } = await supabase.from('profiles').select('rating_negative').eq('id', order.buyer_id).single()
      if (profile) {
        await supabase.from('profiles').update({
          rating_negative: (profile.rating_negative || 0) + 1
        }).eq('id', order.buyer_id)
      }
    }

    // Cập nhật product status
    await supabase.from('products').update({ status: 'cancelled', updated_at: now }).eq('id', productId)

    res.json({
      success: true,
      message: 'Đã huỷ giao dịch và đánh giá tiêu cực cho người mua'
    })
  } catch (error) {
    console.error('❌ Error cancelling order:', error)
    res.status(500).json({ success: false, message: 'Không thể huỷ đơn hàng' })
  }
}

// ============================================
// CHAT ENDPOINTS
// ============================================

/**
 * @route   GET /api/orders/:productId/chat
 * @desc    Lấy tin nhắn chat
 * @access  Private (Buyer/Seller)
 */
export const getChatMessages = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user.id
    const { limit = 50, before } = req.query

    // Kiểm tra order và quyền
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem chat này' })
    }

    // Lấy messages
    let query = supabase
      .from('order_chat')
      .select(`
        id,
        sender_id,
        message,
        attachment_url,
        is_read,
        created_at,
        profiles:sender_id (full_name, avatar_url)
      `)
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error: chatError } = await query

    if (chatError) throw chatError

    // Đánh dấu đã đọc tin nhắn từ người kia
    await supabase
      .from('order_chat')
      .update({ is_read: true })
      .eq('order_id', order.id)
      .neq('sender_id', userId)
      .eq('is_read', false)

    res.json({
      success: true,
      data: (messages || []).reverse() // Đảo lại để tin cũ ở trên
    })
  } catch (error) {
    console.error('❌ Error getting chat messages:', error)
    res.status(500).json({ success: false, message: 'Không thể tải tin nhắn' })
  }
}

/**
 * @route   POST /api/orders/:productId/chat
 * @desc    Gửi tin nhắn chat
 * @access  Private (Buyer/Seller)
 */
export const sendChatMessage = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user.id
    const { message, attachment_url } = req.body

    if (!message?.trim() && !attachment_url) {
      return res.status(400).json({ success: false, message: 'Tin nhắn không được trống' })
    }

    // Kiểm tra order và quyền
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, status')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chat trong đơn hàng này' })
    }

    // Tạo message
    const { data: newMessage, error: insertError } = await supabase
      .from('order_chat')
      .insert({
        order_id: order.id,
        sender_id: userId,
        message: message?.trim() || '',
        attachment_url: attachment_url?.trim() || null
      })
      .select(`
        id,
        sender_id,
        message,
        attachment_url,
        is_read,
        created_at,
        profiles:sender_id (full_name, avatar_url)
      `)
      .single()

    if (insertError) throw insertError

    res.json({
      success: true,
      data: newMessage
    })
  } catch (error) {
    console.error('❌ Error sending chat message:', error)
    res.status(500).json({ success: false, message: 'Không thể gửi tin nhắn' })
  }
}

/**
 * @route   GET /api/orders/:productId/chat/unread
 * @desc    Đếm số tin nhắn chưa đọc
 * @access  Private (Buyer/Seller)
 */
export const getUnreadCount = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user.id

    // Kiểm tra order và quyền
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id')
      .eq('product_id', productId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    if (order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem' })
    }

    // Đếm unread
    const { count, error: countError } = await supabase
      .from('order_chat')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', order.id)
      .neq('sender_id', userId)
      .eq('is_read', false)

    if (countError) throw countError

    res.json({
      success: true,
      data: { unread_count: count || 0 }
    })
  } catch (error) {
    console.error('❌ Error getting unread count:', error)
    res.status(500).json({ success: false, message: 'Không thể đếm tin nhắn' })
  }
}
