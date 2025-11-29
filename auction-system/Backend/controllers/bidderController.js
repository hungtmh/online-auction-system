/**
 * ============================================
 * BIDDER CONTROLLER - KHOA PHỤ TRÁCH
 * ============================================
 * Xử lý các tác vụ dành cho người đấu giá:
 * - Xem sản phẩm đấu giá
 * - Đặt giá đấu
 * - Quản lý watchlist
 * - Xem lịch sử đấu giá
 */

import { supabase } from '../config/supabase.js'
import { getSystemSettingMap } from '../utils/systemSettings.js'
import { uploadBufferToPaymentProofBucket, uploadBufferToAvatarBucket } from '../utils/upload.js'

/**
 * @route   GET /api/bidder/products
 * @desc    Lấy danh sách sản phẩm đang đấu giá
 * @access  Private (Bidder)
 */
export const getAuctionProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, sort = 'ending_soon' } = req.query
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1)
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50)
    const offset = (pageNumber - 1) * limitNumber

    let query = supabase
      .from('products')
      .select(
        `
        *,
        categories (
          id,
          name
        ),
        bids (count)
      `,
        { count: 'exact' }
      )
      .eq('status', 'active')
      .range(offset, offset + limitNumber - 1)

    // Lọc theo danh mục
    if (category) {
      query = query.eq('category_id', category)
    }

    // Sắp xếp
    if (sort === 'ending_soon') {
      query = query.order('end_time', { ascending: true })
    } else if (sort === 'price_low') {
      query = query.order('current_price', { ascending: true })
    } else if (sort === 'price_high') {
      query = query.order('current_price', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) throw error

    const total = typeof count === 'number' ? count : null
    const totalPages = total ? Math.max(Math.ceil(total / limitNumber), 1) : null

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasMore: totalPages ? pageNumber < totalPages : (data || []).length === limitNumber
      }
    })
  } catch (error) {
    console.error('❌ Error getting auction products:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách sản phẩm'
    })
  }
}

/**
 * @route   POST /api/bidder/bids
 * @desc    Đặt giá tự động (Auto Bidding)
 * @access  Private (Bidder)
 * 
 * THUẬT TOÁN:
 * - Tìm bidder A = người có max_bid CAO NHẤT (trong tất cả bidders)
 * - Tìm bidder B = người có max_bid CAO THỨ 2
 * 
 * TH1: max_A >= max_B → giá_hệ_thống = max(max_B, giá_hiện_tại)
 * TH2: max_A < max_B  → giá_hệ_thống = max_A + step (B trở thành người giữ giá)
 * 
 * Nếu chỉ có 1 người bid → giá = starting_price
 */
export const placeBid = async (req, res) => {
  try {
    const { product_id, max_bid } = req.body
    const bidder_id = req.user.id
    const parsedMaxBid = Number(max_bid)

    // Validate input
    if (!product_id || !Number.isFinite(parsedMaxBid) || parsedMaxBid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm hoặc giá tối đa không hợp lệ'
      })
    }

    // 1. Lấy thông tin sản phẩm
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    // Kiểm tra trạng thái sản phẩm
    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không trong trạng thái đấu giá'
      })
    }

    // Kiểm tra thời gian đấu giá
    if (new Date(product.end_time) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Phiên đấu giá đã kết thúc'
      })
    }

    // Kiểm tra giá tối đa >= giá khởi điểm
    if (parsedMaxBid < Number(product.starting_price)) {
      return res.status(400).json({
        success: false,
        message: `Giá tối đa phải >= giá khởi điểm (${Number(product.starting_price).toLocaleString('vi-VN')} đ)`
      })
    }

    // Kiểm tra bidder có bị reject không
    const { data: rejected } = await supabase
      .from('rejected_bidders')
      .select('id')
      .eq('product_id', product_id)
      .eq('bidder_id', bidder_id)
      .single()

    if (rejected) {
      return res.status(403).json({
        success: false,
        message: 'Bạn đã bị từ chối đấu giá sản phẩm này'
      })
    }

    const stepPrice = Number(product.step_price)
    const startingPrice = Number(product.starting_price)
    const currentPrice = Number(product.current_price) || startingPrice

    // 2. Lấy max_bid cao nhất của bidder này (nếu đã bid trước đó)
    const { data: myPreviousBid } = await supabase
      .from('bids')
      .select('max_bid_amount')
      .eq('product_id', product_id)
      .eq('bidder_id', bidder_id)
      .eq('is_rejected', false)
      .order('max_bid_amount', { ascending: false })
      .limit(1)
      .single()

    const myPreviousMaxBid = myPreviousBid ? Number(myPreviousBid.max_bid_amount) : 0

    // Kiểm tra giá mới phải cao hơn giá max trước đó của chính mình
    if (parsedMaxBid <= myPreviousMaxBid) {
      return res.status(400).json({
        success: false,
        message: `Giá tối đa mới phải cao hơn giá bạn đã đặt trước đó (${myPreviousMaxBid.toLocaleString('vi-VN')} đ)`,
        data: {
          your_current_max_bid: myPreviousMaxBid,
          current_price: currentPrice
        }
      })
    }

    // 3. Lấy người đang giữ giá CAO NHẤT TRƯỚC KHI tôi đặt (không tính tôi)
    const { data: currentWinner } = await supabase
      .from('bids')
      .select('bidder_id, max_bid_amount, created_at')
      .eq('product_id', product_id)
      .neq('bidder_id', bidder_id)
      .eq('is_rejected', false)
      .order('max_bid_amount', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    // 4. Tính giá theo công thức
    // A = người đang giữ giá cao nhất TRƯỚC KHI B (tôi) vào
    // B = tôi (người mới đặt)
    
    let newCurrentPrice
    let winnerBidderId
    let isWinning

    if (!currentWinner) {
      // Chưa ai bid trước tôi → tôi là người đầu tiên
      newCurrentPrice = startingPrice
      winnerBidderId = bidder_id
      isWinning = true
    } else {
      const maxA = Number(currentWinner.max_bid_amount) // max của người đang giữ giá
      const maxB = parsedMaxBid // max của tôi (người mới vào)

      if (maxA >= maxB) {
        // TH1: max_A >= max_B → A vẫn giữ giá
        // Giá = max(max_B, giá_hiện_tại)
        newCurrentPrice = Math.max(maxB, currentPrice)
        winnerBidderId = currentWinner.bidder_id
        isWinning = false
      } else {
        // TH2: max_A < max_B → B (tôi) giữ giá
        // Giá = max_A + step
        newCurrentPrice = maxA + stepPrice
        // Nhưng không vượt quá max của tôi
        if (newCurrentPrice > maxB) {
          newCurrentPrice = maxB
        }
        winnerBidderId = bidder_id
        isWinning = true
      }
    }

    // 5. Tạo bid record mới cho tôi
    const { error: bidError } = await supabase
      .from('bids')
      .insert({
        product_id,
        bidder_id,
        bid_amount: newCurrentPrice,
        max_bid_amount: parsedMaxBid,
        is_auto_bid: true
      })

    if (bidError) throw bidError

    // 6. Cập nhật current_price và bid_count của sản phẩm
    await supabase
      .from('products')
      .update({ 
        current_price: newCurrentPrice,
        bid_count: product.bid_count + 1
      })
      .eq('id', product_id)

    // 7. Xử lý auto extend nếu cần
    if (product.auto_extend) {
      const now = Date.now()
      const endTimeMs = new Date(product.end_time).getTime()
      const timeRemaining = endTimeMs - now

      let extendMinutes = product.auto_extend_minutes
      let extendThreshold = product.auto_extend_threshold

      if (!extendMinutes || !extendThreshold) {
        const settings = await getSystemSettingMap(['auto_extend_minutes', 'auto_extend_threshold'])
        extendMinutes = extendMinutes || Number(settings.auto_extend_minutes ?? 10)
        extendThreshold = extendThreshold || Number(settings.auto_extend_threshold ?? 5)
      }

      extendMinutes = Number.isNaN(Number(extendMinutes)) ? 10 : Number(extendMinutes)
      extendThreshold = Number.isNaN(Number(extendThreshold)) ? 5 : Number(extendThreshold)

      const thresholdMs = extendThreshold * 60 * 1000

      if (timeRemaining <= thresholdMs) {
        const newEndTime = new Date(endTimeMs + extendMinutes * 60 * 1000).toISOString()
        await supabase
          .from('products')
          .update({ end_time: newEndTime })
          .eq('id', product_id)
      }
    }

    // 8. Trả về kết quả
    res.json({
      success: true,
      message: isWinning 
        ? 'Đặt giá thành công! Bạn đang giữ giá sản phẩm.' 
        : 'Đặt giá thành công! Tuy nhiên có người khác đã đặt giá cao hơn.',
      data: {
        current_price: newCurrentPrice,
        your_max_bid: parsedMaxBid,
        is_winning: isWinning
      }
    })
  } catch (error) {
    console.error('❌ Error placing auto bid:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể đặt giá tự động'
    })
  }
}

/**
 * @route   GET /api/bidder/bids/my/status/:productId
 * @desc    Lấy trạng thái auto bid của tôi cho sản phẩm cụ thể
 * @access  Private (Bidder)
 */
export const getMyAutoBidStatus = async (req, res) => {
  try {
    const { productId } = req.params
    const bidder_id = req.user.id

    // Lấy max bid của tôi cho sản phẩm này
    const { data: myBid, error: myBidError } = await supabase
      .from('bids')
      .select('max_bid_amount, bid_amount, created_at')
      .eq('product_id', productId)
      .eq('bidder_id', bidder_id)
      .eq('is_rejected', false)
      .order('max_bid_amount', { ascending: false })
      .limit(1)
      .single()

    if (myBidError && myBidError.code !== 'PGRST116') {
      throw myBidError
    }

    if (!myBid) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đặt giá cho sản phẩm này'
      })
    }

    // Lấy bid cao nhất của người khác
    const { data: highestOtherBid } = await supabase
      .from('bids')
      .select('max_bid_amount, bidder_id, created_at')
      .eq('product_id', productId)
      .neq('bidder_id', bidder_id)
      .eq('is_rejected', false)
      .order('max_bid_amount', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    const myMaxBid = Number(myBid.max_bid_amount)
    let isWinning = true

    if (highestOtherBid) {
      const otherMaxBid = Number(highestOtherBid.max_bid_amount)
      if (otherMaxBid > myMaxBid) {
        isWinning = false
      } else if (otherMaxBid === myMaxBid) {
        // Cùng giá -> ai đặt trước thắng
        // So sánh thời gian: tìm bid đầu tiên của mỗi người với max_bid này
        const { data: myFirstBid } = await supabase
          .from('bids')
          .select('created_at')
          .eq('product_id', productId)
          .eq('bidder_id', bidder_id)
          .gte('max_bid_amount', myMaxBid)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        const { data: otherFirstBid } = await supabase
          .from('bids')
          .select('created_at')
          .eq('product_id', productId)
          .eq('bidder_id', highestOtherBid.bidder_id)
          .gte('max_bid_amount', otherMaxBid)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (myFirstBid && otherFirstBid) {
          isWinning = new Date(myFirstBid.created_at) <= new Date(otherFirstBid.created_at)
        }
      }
    }

    res.json({
      success: true,
      data: {
        your_max_bid: myMaxBid,
        is_winning: isWinning
      }
    })
  } catch (error) {
    console.error('❌ Error getting auto bid status:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy trạng thái đấu giá'
    })
  }
}

/**
 * @route   GET /api/bidder/bids/my
 * @desc    Lấy lịch sử đấu giá của tôi (chỉ lấy bid cao nhất mỗi sản phẩm)
 * @access  Private (Bidder)
 */
export const getMyBids = async (req, res) => {
  try {
    const bidder_id = req.user.id

    // Lấy tất cả bids của user với thông tin sản phẩm
    const { data: allBids, error } = await supabase
      .from('bids')
      .select(`
        *,
        products (
          id,
          name,
          current_price,
          end_time,
          status,
          thumbnail_url,
          winner_id
        )
      `)
      .eq('bidder_id', bidder_id)
      .order('bid_amount', { ascending: false })

    if (error) throw error

    // Group by product_id và chỉ lấy bid cao nhất
    const productBidsMap = new Map()
    for (const bid of allBids) {
      const productId = bid.product_id
      if (!productBidsMap.has(productId)) {
        productBidsMap.set(productId, bid)
      }
      // Vì đã order by bid_amount desc, bid đầu tiên là cao nhất
    }

    const uniqueBids = Array.from(productBidsMap.values())
    
    // Sort by created_at descending (latest first)
    uniqueBids.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    res.json({
      success: true,
      data: uniqueBids
    })
  } catch (error) {
    console.error('❌ Error getting my bids:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử đấu giá'
    })
  }
}

/**
 * @route   POST /api/bidder/watchlist
 * @desc    Thêm sản phẩm vào watchlist
 * @access  Private (Bidder)
 */
export const addToWatchlist = async (req, res) => {
  try {
    const { product_id } = req.body
    const bidder_id = req.user.id

    // Kiểm tra đã tồn tại chưa
    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', bidder_id)
      .single()

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có trong watchlist'
      })
    }

    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        product_id,
        user_id: bidder_id
      })
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã thêm vào watchlist',
      data: data
    })
  } catch (error) {
    console.error('❌ Error adding to watchlist:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể thêm vào watchlist'
    })
  }
}

/**
 * @route   DELETE /api/bidder/watchlist/:productId
 * @desc    Xóa sản phẩm khỏi watchlist
 * @access  Private (Bidder)
 */
export const removeFromWatchlist = async (req, res) => {
  try {
    const { productId } = req.params
    const bidder_id = req.user.id

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', bidder_id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Đã xóa khỏi watchlist'
    })
  } catch (error) {
    console.error('❌ Error removing from watchlist:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể xóa khỏi watchlist'
    })
  }
}

/**
 * @route   GET /api/bidder/watchlist
 * @desc    Lấy danh sách watchlist
 * @access  Private (Bidder)
 */
export const getWatchlist = async (req, res) => {
  try {
    const bidder_id = req.user.id

    const { data, error } = await supabase
      .from('watchlist')
      .select(`
        *,
        products (
          id,
          name,
          current_price,
          end_time,
          status,
          thumbnail_url,
          bid_count
        )
      `)
      .eq('user_id', bidder_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting watchlist:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy watchlist'
    })
  }
}

/**
 * @route   GET /api/bidder/products/:id/bids
 * @desc    Lấy lịch sử giá đấu của sản phẩm
 * @access  Private (Bidder)
 */
export const getBidHistory = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        profiles (
          full_name
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
    console.error('❌ Error getting bid history:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử đấu giá'
    })
  }
}

/**
 * @route   POST /api/bidder/products/:id/questions
 * @desc    Gửi câu hỏi cho người bán
 * @access  Private (Bidder)
 */
export const askSellerQuestion = async (req, res) => {
  try {
    const { id } = req.params
    const { question } = req.body
    const askerId = req.user.id

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung câu hỏi'
      })
    }

    if (question.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi cần ít nhất 5 ký tự'
      })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status, end_time')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    if (product.seller_id === askerId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn là người bán của sản phẩm này'
      })
    }

    const now = new Date()
    if (new Date(product.end_time) < now) {
      return res.status(400).json({
        success: false,
        message: 'Phiên đấu giá đã kết thúc'
      })
    }

    const { data: inserted, error: insertError } = await supabase
      .from('questions')
      .insert({
        product_id: id,
        asker_id: askerId,
        question: question.trim()
      })
      .select(`
        id,
        asker_id,
        question,
        answer,
        created_at,
        answered_at,
        asker:profiles!questions_asker_id_fkey ( id, full_name )
      `)
      .single()

    if (insertError) throw insertError

    res.json({
      success: true,
      message: 'Đã gửi câu hỏi cho người bán',
      data: inserted
    })
  } catch (error) {
    console.error('❌ Error asking question:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể gửi câu hỏi cho người bán'
    })
  }
}

/**
 * @route   GET /api/bidder/orders/:productId
 * @desc    Lấy thông tin checkout của sản phẩm đã thắng
 * @access  Private (Bidder)
 */
export const getCheckoutOrder = async (req, res) => {
  try {
    const { productId } = req.params
    const bidderId = req.user.id

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã sản phẩm'
      })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, description, thumbnail_url, current_price, final_price, status, winner_id, seller_id, end_time, bid_count')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    if (product.winner_id !== bidderId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là người thắng cuộc của sản phẩm này'
      })
    }

    const { data: seller } = await supabase
      .from('profiles')
      .select('id, full_name, phone, address')
      .eq('id', product.seller_id)
      .maybeSingle()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()

    if (orderError) throw orderError

    res.json({
      success: true,
      data: {
        product: {
          ...product,
          seller_name: seller?.full_name || null,
          seller_phone: seller?.phone || null,
          seller_address: seller?.address || null
        },
        order: order || null
      }
    })
  } catch (error) {
    console.error('❌ Error getting checkout order:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể tải thông tin thanh toán'
    })
  }
}

/**
 * @route   POST /api/bidder/orders
 * @desc    Lưu thông tin checkout (địa chỉ giao hàng, chứng từ)
 * @access  Private (Bidder)
 */
export const upsertCheckoutOrder = async (req, res) => {
  try {
    const { product_id, shipping_address, payment_proof_url } = req.body
    const bidderId = req.user.id

    if (!product_id || !shipping_address || !shipping_address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin thanh toán'
      })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, winner_id, current_price, starting_price, final_price, status, end_time')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      })
    }

    if (product.winner_id !== bidderId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là người thắng cuộc của sản phẩm này'
      })
    }

    const normalizedAddress = shipping_address.trim()
    const finalPrice = Number(product.final_price || product.current_price || product.starting_price || 0)

    const { data: existingOrder, error: existingError } = await supabase
      .from('orders')
      .select('*')
      .eq('product_id', product_id)
      .maybeSingle()

    if (existingError) throw existingError

    let savedOrder = existingOrder
    const paymentProof = payment_proof_url?.trim() ? payment_proof_url.trim() : null

    if (existingOrder) {
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          shipping_address: normalizedAddress,
          payment_proof_url: paymentProof || existingOrder.payment_proof_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id)
        .select('*')
        .single()

      if (updateError) throw updateError
      savedOrder = updatedOrder
    } else {
      const { data: insertedOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          product_id,
          seller_id: product.seller_id,
          buyer_id: bidderId,
          final_price: finalPrice,
          shipping_address: normalizedAddress,
          payment_proof_url: paymentProof,
          status: 'pending_payment'
        })
        .select('*')
        .single()

      if (insertError) throw insertError
      savedOrder = insertedOrder
    }

    res.json({
      success: true,
      message: 'Đã lưu thông tin thanh toán',
      data: savedOrder
    })
  } catch (error) {
    console.error('❌ Error saving checkout order:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lưu thông tin thanh toán'
    })
  }
}

/**
 * @route   POST /api/bidder/uploads/payment-proof
 * @desc    Upload ảnh chứng từ thanh toán
 * @access  Private (Bidder)
 */
export const uploadPaymentProofImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file cần upload' })
    }

    const bidderId = req.user.id
    const { buffer, mimetype } = req.file

    const { filePath, publicUrl } = await uploadBufferToPaymentProofBucket({
      buffer,
      mimetype,
      userId: bidderId
    })

    res.json({
      success: true,
      data: {
        url: publicUrl,
        path: filePath
      }
    })
  } catch (error) {
    console.error('❌ Error uploading payment proof:', error)
    res.status(500).json({ success: false, message: 'Không thể upload chứng từ thanh toán' })
  }
}

/**
 * @route   PUT /api/bidder/profile
 * @desc    Cập nhật thông tin hồ sơ bidder
 * @access  Private (Bidder)
 */
export const updateBidderProfile = async (req, res) => {
  try {
    const bidderId = req.user.id
    const { full_name, phone, address, date_of_birth } = req.body

    const updates = {
      updated_at: new Date().toISOString()
    }

    if (full_name?.trim()) {
      updates.full_name = full_name.trim()
    }
    if (phone !== undefined) {
      updates.phone = phone?.trim() || null
    }
    if (address !== undefined) {
      updates.address = address?.trim() || null
    }
    if (date_of_birth !== undefined) {
      updates.date_of_birth = date_of_birth || null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', bidderId)
      .select('id, email, full_name, phone, address, date_of_birth, avatar_url, rating_positive, rating_negative, role')
      .single()

    if (error) throw error

    // Sync full_name with Supabase Auth if updated
    if (updates.full_name) {
      try {
        await supabase.auth.admin.updateUserById(bidderId, {
          user_metadata: { full_name: updates.full_name }
        })
      } catch (adminError) {
        console.warn('⚠️  Không thể đồng bộ tên với Supabase Auth:', adminError.message)
      }
    }

    res.json({ success: true, message: 'Cập nhật hồ sơ thành công.', data: profile })
  } catch (error) {
    console.error('❌ Error updating bidder profile:', error)
    res.status(500).json({ success: false, message: 'Không thể cập nhật hồ sơ.' })
  }
}

/**
 * @route   POST /api/bidder/profile/avatar
 * @desc    Upload ảnh đại diện bidder
 * @access  Private (Bidder)
 */
export const uploadBidderAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file cần upload.' })
    }

    const bidderId = req.user.id
    const { buffer, mimetype } = req.file

    const { publicUrl } = await uploadBufferToAvatarBucket({
      buffer,
      mimetype,
      userId: bidderId
    })

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', bidderId)

    if (error) throw error

    res.json({ success: true, data: { avatar_url: publicUrl } })
  } catch (error) {
    console.error('❌ Error uploading bidder avatar:', error)
    res.status(500).json({ success: false, message: 'Không thể upload ảnh đại diện.' })
  }
}

/**
 * @route   GET /api/bidder/products/:id/bid-status
 * @desc    Kiểm tra trạng thái bid của user cho sản phẩm
 * @access  Private (Bidder)
 */
export const getUserBidStatus = async (req, res) => {
  try {
    const { id: product_id } = req.params
    const user_id = req.user.id

    // Gọi stored function
    const { data, error } = await supabase.rpc('get_user_bid_status', {
      p_product_id: product_id,
      p_user_id: user_id
    })

    if (error) {
      console.error('❌ Get bid status error:', error)
      throw error
    }

    res.json({
      success: true,
      data: data || {}
    })
  } catch (error) {
    console.error('❌ Error getting user bid status:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy trạng thái đấu giá'
    })
  }
}

/**
 * @route   GET /api/bidder/products/:id/current-winner
 * @desc    Lấy thông tin người đang thắng đấu giá
 * @access  Private (Bidder)
 */
export const getCurrentWinner = async (req, res) => {
  try {
    const { id: product_id } = req.params

    // Gọi stored function
    const { data, error } = await supabase.rpc('get_current_winner', {
      p_product_id: product_id
    })

    if (error) {
      console.error('❌ Get current winner error:', error)
      throw error
    }

    // Nếu không có ai bid
    if (!data || data.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Chưa có ai đấu giá'
      })
    }

    res.json({
      success: true,
      data: data[0] // Function trả về array, lấy phần tử đầu tiên
    })
  } catch (error) {
    console.error('❌ Error getting current winner:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin người thắng'
    })
  }
}

