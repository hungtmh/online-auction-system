/**
 * ============================================
 * SELLER API SERVICE - CƯỜNG PHỤ TRÁCH
 * ============================================
 * API calls cho Seller Dashboard
 */

import api from './api'

const sellerAPI = {
  /**
   * Đăng sản phẩm mới
   * @param {Object} productData
   */
  createProduct: async (productData) => {
    const response = await api.post('/api/seller/products', productData)
    return response.data
  },

  /**
   * Lấy danh sách sản phẩm của tôi
   * @param {Object} params - { status, page, limit }
   */
  getMyProducts: async (params = {}) => {
    const response = await api.get('/api/seller/products', { params })
    return response.data
  },

  /**
   * Cập nhật sản phẩm
   * @param {string} productId
   * @param {Object} productData
   */
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/api/seller/products/${productId}`, productData)
    return response.data
  },

  /**
   * Xóa sản phẩm
   * @param {string} productId
   */
  deleteProduct: async (productId) => {
    const response = await api.delete(`/api/seller/products/${productId}`)
    return response.data
  },

  /**
   * Xem danh sách giá đấu của sản phẩm
   * @param {string} productId
   */
  getProductBids: async (productId) => {
    const response = await api.get(`/api/seller/products/${productId}/bids`)
    return response.data
  },

  /**
   * Lấy thống kê doanh thu
   */
  getSalesStats: async () => {
    const response = await api.get('/api/seller/stats')
    return response.data
  }
}

export default sellerAPI
