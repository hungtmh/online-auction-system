/**
 * ============================================
 * GUEST API SERVICE - KHẢI PHỤ TRÁCH
 * ============================================
 * API calls cho Guest Homepage
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const guestAPI = {
  /**
   * Lấy danh sách sản phẩm
   * @param {Object} params - { page, limit, category, status }
   */
  getProducts: async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/guest/products`, {
      params
    })
    return response.data
  },

  /**
   * Lấy chi tiết sản phẩm
   * @param {string} productId
   */
  getProductById: async (productId) => {
    const response = await axios.get(`${API_URL}/api/guest/products/${productId}`)
    return response.data
  },

  /**
   * Tìm kiếm sản phẩm
   * @param {string} keyword
   * @param {Object} params - { page, limit }
   */
  searchProducts: async (keyword, params = {}) => {
    const response = await axios.get(`${API_URL}/api/guest/search`, {
      params: { q: keyword, ...params }
    })
    return response.data
  },

  /**
   * Lấy danh sách danh mục
   */
  getCategories: async () => {
    const response = await axios.get(`${API_URL}/api/guest/categories`)
    return response.data
  },

  /**
   * Lấy sản phẩm nổi bật
   * @param {string} type - 'ending_soon' | 'most_bids' | 'highest_price'
   * @param {number} limit - Số lượng sản phẩm
   */
  getFeaturedProducts: async (type = 'ending_soon', limit = 6) => {
    const response = await axios.get(`${API_URL}/api/guest/featured`, {
      params: { type, limit }
    })
    return response.data
  }
}

export default guestAPI
