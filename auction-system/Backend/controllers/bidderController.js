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
 * @desc    Đặt giá đấu
 * @access  Private (Bidder)
 */
export const placeBid = async (req, res) => {
  try {
    const { product_id, bid_amount } = req.body
    const bidder_id = req.user.id
    const parsedBidAmount = Number(bid_amount)

    // Validate input
    if (!product_id || !Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm hoặc giá đấu'
      })
    }

    // Kiểm tra sản phẩm có tồn tại
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

    // Kiểm tra giá đấu phải lớn hơn giá hiện tại + step
  const currentPriceValue = Number(product.current_price)
  const startingPrice = Number(product.starting_price) || 0
  const stepPrice = Number(product.step_price) || 0
  const basePrice = currentPriceValue > 0 ? currentPriceValue : startingPrice
  const minBid = basePrice + stepPrice
    if (parsedBidAmount < minBid) {
      return res.status(400).json({
        success: false,
        message: `Giá đấu phải lớn hơn ${minBid.toLocaleString('vi-VN')} đ`
      })
    }

    // Tạo bid mới
    const { data: newBid, error: bidError } = await supabase
      .from('bids')
      .insert({
        product_id,
        bidder_id,
        bid_amount: parsedBidAmount
      })
      .select()
      .single()

    if (bidError) throw bidError

    // Cập nhật current_price của product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        current_price: parsedBidAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (updateError) throw updateError

    res.json({
      success: true,
      message: 'Đặt giá thành công',
      data: newBid
    })
  } catch (error) {
    console.error('❌ Error placing bid:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể đặt giá'
    })
  }
}

/**
 * @route   GET /api/bidder/bids/my
 * @desc    Lấy lịch sử đấu giá của tôi
 * @access  Private (Bidder)
 */
export const getMyBids = async (req, res) => {
  try {
    const bidder_id = req.user.id

    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          end_time,
          status,
          image_url
        )
      `)
      .eq('bidder_id', bidder_id)
  .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data: data
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
      .eq('bidder_id', bidder_id)
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
        bidder_id,
        added_at: new Date().toISOString()
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
      .eq('bidder_id', bidder_id)

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
          title,
          current_price,
          end_time,
          status,
          image_url,
          bid_count
        )
      `)
      .eq('bidder_id', bidder_id)
      .order('added_at', { ascending: false })

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
