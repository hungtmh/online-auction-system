/**
 * ============================================
 * GUEST CONTROLLER - KHẢI PHỤ TRÁCH
 * ============================================
 * Xử lý các tác vụ dành cho khách chưa đăng nhập:
 * - Xem danh sách sản phẩm (public)
 * - Xem chi tiết sản phẩm
 * - Tìm kiếm sản phẩm
 * - Xem danh mục
 * - Sản phẩm nổi bật
 */

import { supabase } from '../config/supabase.js'

/**
 * @route   GET /api/guest/products
 * @desc    Lấy danh sách tất cả sản phẩm đang đấu giá (public)
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, status = 'active' } = req.query

    const offset = (page - 1) * limit

    let selectStr = `
      *,
      categories (
        id,
        name,
        parent_id
      )
    `

    let query = supabase
      .from('products')
      .select(selectStr, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    // Lọc theo danh mục nếu có
    if (category) {
      query = query.eq('category_id', category)
    }

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
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
 * @route   GET /api/guest/products/:id
 * @desc    Xem chi tiết sản phẩm
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          parent_id
        ),
        product_descriptions (
          content
        ),
        bids (
          id,
          bid_amount,
          created_at,
          profiles (
            full_name
          )
        )
      `)
      .eq('id', id)
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
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting product:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin sản phẩm'
    })
  }
}

/**
 * @route   GET /api/guest/search?q=keyword
 * @desc    Tìm kiếm sản phẩm theo từ khóa
 * @access  Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      })
    }

    const offset = (page - 1) * limit

    // TODO: Implement full-text search using search_vector
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .textSearch('search_vector', q)
      .eq('status', 'active')
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      success: true,
      data: data,
      query: q
    })
  } catch (error) {
    console.error('❌ Error searching products:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm sản phẩm'
    })
  }
}

/**
 * @route   GET /api/guest/categories
 * @desc    Lấy danh sách danh mục
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error

    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('❌ Error getting categories:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh mục'
    })
  }
}

/**
 * @route   GET /api/guest/featured
 * @desc    Lấy sản phẩm nổi bật (sắp kết thúc, nhiều lượt đấu, giá cao)
 * @access  Public
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const { type = 'ending_soon', limit = 6 } = req.query

    let data, error

    switch (type) {
      case 'ending_soon':
        // Sản phẩm sắp kết thúc
        ({ data, error } = await supabase.rpc('get_top_ending_soon', {
          p_limit: parseInt(limit)
        }))
        break

      case 'most_bids':
        // Sản phẩm nhiều lượt đấu nhất
        ({ data, error } = await supabase.rpc('get_top_most_bids', {
          p_limit: parseInt(limit)
        }))
        break

      case 'highest_price':
        // Sản phẩm giá cao nhất
        ({ data, error } = await supabase.rpc('get_top_highest_price', {
          p_limit: parseInt(limit)
        }))
        break

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid type parameter'
        })
    }

    if (error) throw error

    res.json({
      success: true,
      data: data,
      type: type
    })
  } catch (error) {
    console.error('❌ Error getting featured products:', error)
    res.status(500).json({
      success: false,
      message: 'Không thể lấy sản phẩm nổi bật'
    })
  }
}
