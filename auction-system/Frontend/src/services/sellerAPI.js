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
    const response = await api.post('/seller/products', productData)
    return response.data
  },

  /**
   * Upload ảnh sản phẩm
   * @param {File} file
   */
  uploadProductImage: async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/seller/uploads/images', formData)

    return response.data
  },

  /**
   * Lấy danh sách sản phẩm của tôi
   * @param {Object} params - { status, page, limit }
   */
  getMyProducts: async (params = {}) => {
    const response = await api.get('/seller/products', { params })
    return response.data
  },

  /**
   * Cập nhật sản phẩm
   * @param {string} productId
   * @param {Object} productData
   */
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/seller/products/${productId}`, productData)
    return response.data
  },

  /**
   * Xóa sản phẩm
   * @param {string} productId
   */
  deleteProduct: async (productId) => {
    const response = await api.delete(`/seller/products/${productId}`)
    return response.data
  },

  /**
   * Xem danh sách giá đấu của sản phẩm
   * @param {string} productId
   */
  getProductBids: async (productId) => {
    const response = await api.get(`/seller/products/${productId}/bids`)
    return response.data
  },

  /**
   * Lấy thống kê doanh thu
   */
  getSalesStats: async () => {
    const response = await api.get('/seller/stats')
    return response.data
  }
}

export default sellerAPI
