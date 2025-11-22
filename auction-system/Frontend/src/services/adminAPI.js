/**
 * ============================================
 * ADMIN API SERVICE - THẮNG PHỤ TRÁCH
 * ============================================
 * API calls cho Admin Dashboard
 */

import api from './api'

const adminAPI = {
  // ============= USER MANAGEMENT =============

  /**
   * Lấy danh sách users
   * @param {Object} params - { role, page, limit }
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  /**
   * Lấy chi tiết user
   * @param {string} userId
   */
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  /**
   * Thay đổi role của user
   * @param {string} userId
   * @param {string} role - 'guest' | 'bidder' | 'seller' | 'admin'
   */
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role })
    return response.data
  },

  /**
   * Cấm user
   * @param {string} userId
   */
  banUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/ban`)
    return response.data
  },

  /**
   * Xóa user
   * @param {string} userId
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  // ============= PRODUCT MANAGEMENT =============

  /**
   * Lấy tất cả sản phẩm
   * @param {Object} params - { status, page, limit }
   */
  getAllProducts: async (params = {}) => {
    const response = await api.get('/admin/products', { params })
    return response.data
  },

  /**
   * Duyệt sản phẩm
   * @param {string} productId
   */
  approveProduct: async (productId) => {
    const response = await api.post(`/admin/products/${productId}/approve`)
    return response.data
  },

  /**
   * Từ chối sản phẩm
   * @param {string} productId
   * @param {string} reason
   */
  rejectProduct: async (productId, reason) => {
    const response = await api.post(`/admin/products/${productId}/reject`, { reason })
    return response.data
  },

  /**
   * Xóa sản phẩm
   * @param {string} productId
   */
  deleteProduct: async (productId) => {
    const response = await api.delete(`/admin/products/${productId}`)
    return response.data
  },

  // ============= UPGRADE REQUESTS =============

  /**
   * Lấy yêu cầu nâng cấp
   * @param {string} status - 'pending' | 'approved' | 'rejected'
   */
  getUpgradeRequests: async (status = 'pending') => {
    const response = await api.get('/admin/upgrades', { params: { status } })
    return response.data
  },

  /**
   * Duyệt yêu cầu nâng cấp
   * @param {string} requestId
   */
  approveUpgrade: async (requestId) => {
    const response = await api.post(`/admin/upgrades/${requestId}/approve`)
    return response.data
  },

  /**
   * Từ chối yêu cầu nâng cấp
   * @param {string} requestId
   */
  rejectUpgrade: async (requestId) => {
    const response = await api.post(`/admin/upgrades/${requestId}/reject`)
    return response.data
  },

  // ============= SYSTEM STATS =============

  /**
   * Lấy thống kê hệ thống
   */
  getSystemStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  // ============= BID MANAGEMENT =============

  /**
   * Lấy lịch sử đấu giá
   * @param {Object} params - { status, page, limit }
   */
  getBidHistory: async (params = {}) => {
    const response = await api.get('/admin/bids', { params })
    return response.data
  },

  /**
   * Hủy bid (xử lý gian lận)
   * @param {string} bidId
   * @param {string} reason
   */
  cancelBid: async (bidId, reason) => {
    const response = await api.post(`/admin/bids/${bidId}/cancel`, { reason })
    return response.data
  },

  /**
   * Giải quyết tranh chấp
   * @param {string} bidId
   * @param {string} resolution - 'approve' | 'reject'
   */
  resolveDispute: async (bidId, resolution) => {
    const response = await api.post(`/admin/bids/${bidId}/resolve`, { resolution })
    return response.data
  },

  // ============= SYSTEM SETTINGS =============

  /**
   * Lấy cài đặt hệ thống
   */
  getSystemSettings: async () => {
    const response = await api.get('/admin/settings')
    return response.data
  },

  /**
   * Cập nhật cài đặt hệ thống
   * @param {Object} settings
   */
  updateSystemSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings)
    return response.data
  }
}

export default adminAPI
