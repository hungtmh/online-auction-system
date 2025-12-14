/**
 * ============================================
 * ORDER API - Quản lý hoàn tất đơn hàng
 * ============================================
 */

import api from './api'

const orderAPI = {
  /**
   * Lấy thông tin đơn hàng
   * @param {string} productId
   */
  getOrder: async (productId) => {
    const response = await api.get(`/orders/${productId}`)
    return response.data
  },

  /**
   * Bước 1: Buyer gửi hoá đơn thanh toán + địa chỉ
   * @param {string} productId
   * @param {Object} payload - { shipping_address, payment_proof_url }
   */
  submitPaymentProof: async (productId, payload) => {
    const response = await api.post(`/orders/${productId}/step1`, payload)
    return response.data
  },

  /**
   * Bước 2: Seller xác nhận thanh toán + gửi hoá đơn vận chuyển
   * @param {string} productId
   * @param {Object} payload - { shipping_tracking_number?, shipping_proof_url? }
   */
  confirmPaymentAndShip: async (productId, payload = {}) => {
    const response = await api.post(`/orders/${productId}/step2`, payload)
    return response.data
  },

  /**
   * Bước 3: Buyer xác nhận đã nhận hàng
   * @param {string} productId
   */
  confirmDelivery: async (productId) => {
    const response = await api.post(`/orders/${productId}/step3`)
    return response.data
  },

  /**
   * Bước 4: Đánh giá giao dịch
   * @param {string} productId
   * @param {Object} payload - { rating: 'positive'|'negative', comment? }
   */
  submitRating: async (productId, payload) => {
    const response = await api.post(`/orders/${productId}/rate`, payload)
    return response.data
  },

  /**
   * Seller huỷ đơn hàng
   * @param {string} productId
   * @param {string} reason
   */
  cancelOrder: async (productId, reason = '') => {
    const response = await api.post(`/orders/${productId}/cancel`, { reason })
    return response.data
  },

  // ============================================
  // CHAT
  // ============================================

  /**
   * Lấy tin nhắn chat
   * @param {string} productId
   * @param {Object} params - { limit?, before? }
   */
  getChatMessages: async (productId, params = {}) => {
    const response = await api.get(`/orders/${productId}/chat`, { params })
    return response.data
  },

  /**
   * Gửi tin nhắn
   * @param {string} productId
   * @param {Object} payload - { message, attachment_url? }
   */
  sendChatMessage: async (productId, payload) => {
    const response = await api.post(`/orders/${productId}/chat`, payload)
    return response.data
  },

  /**
   * Đếm tin nhắn chưa đọc
   * @param {string} productId
   */
  getUnreadCount: async (productId) => {
    const response = await api.get(`/orders/${productId}/chat/unread`)
    return response.data
  },

  /**
   * Upload hoá đơn thanh toán (sử dụng API upload từ bidder)
   * @param {File} file
   */
  uploadPaymentProof: async (file) => {
    const formData = new FormData()
    formData.append('proof', file)
    const response = await api.post('/bidder/uploads/payment-proof', formData)
    return response.data
  }
}

export default orderAPI
