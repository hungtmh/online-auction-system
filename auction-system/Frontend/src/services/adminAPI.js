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
   * Gỡ cấm user (hoàn tác)
   * @param {string} userId
   */
  unbanUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/unban`)
    return response.data
  },

  /**
   * Reset mật khẩu user và gửi email thông báo
   * @param {string} userId
   */
  resetUserPassword: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/reset-password`)
    return response.data
  },

  /**
   * Xóa user
   * @param {string} userId
   * @deprecated Sử dụng banUser thay thế
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
   * Hủy sản phẩm (set status = cancelled, không xóa khỏi database)
   * @param {string} productId
   * @param {string} reason - Lý do hủy (optional)
   */
  cancelProduct: async (productId, reason) => {
    const response = await api.post(`/admin/products/${productId}/cancel`, { reason })
    return response.data
  },

  /**
   * Gỡ hủy sản phẩm (set status = pending để admin duyệt lại)
   * @param {string} productId
   */
  uncancelProduct: async (productId) => {
    const response = await api.post(`/admin/products/${productId}/uncancel`)
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

  /**
   * Lấy dữ liệu biểu đồ 7 ngày gần nhất
   */
  getChartData: async () => {
    const response = await api.get('/admin/chart-data')
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
  },

  // ============= CATEGORY MANAGEMENT =============

  /**
   * Lấy danh sách categories
   */
  getAllCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  /**
   * Lấy chi tiết category
   * @param {string} categoryId
   */
  getCategoryById: async (categoryId) => {
    const response = await api.get(`/admin/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Tạo category mới
   * @param {Object} categoryData - { name, slug, description, is_active }
   */
  createCategory: async (categoryData) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },

  /**
   * Cập nhật category
   * @param {string} categoryId
   * @param {Object} categoryData - { name, slug, description, is_active }
   */
  updateCategory: async (categoryId, categoryData) => {
    const response = await api.put(`/admin/categories/${categoryId}`, categoryData);
    return response.data;
  },

  /**
   * Xóa category (soft delete - set is_active = false)
   * @param {string} categoryId
   */
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // ============= SPAM MANAGEMENT =============

  /**
   * Lấy danh sách báo cáo spam
   * @param {Object} params - { status, type, page, limit }
   */
  getSpamReports: async (params = {}) => {
    const response = await api.get('/admin/spam-reports', { params })
    return response.data
  },

  /**
   * Lấy chi tiết báo cáo spam
   * @param {string} reportId
   */
  getSpamReportById: async (reportId) => {
    const response = await api.get(`/admin/spam-reports/${reportId}`)
    return response.data
  },

  /**
   * Xử lý báo cáo spam (xác nhận là spam)
   * @param {string} reportId
   * @param {Object} data - { action, admin_note }
   */
  resolveSpamReport: async (reportId, data) => {
    const response = await api.post(`/admin/spam-reports/${reportId}/resolve`, data)
    return response.data
  },

  /**
   * Bỏ qua báo cáo spam
   * @param {string} reportId
   * @param {Object} data - { admin_note }
   */
  dismissSpamReport: async (reportId, data = {}) => {
    const response = await api.post(`/admin/spam-reports/${reportId}/dismiss`, data)
    return response.data
  },

  /**
   * Lấy thống kê spam
   */
  getSpamStats: async () => {
    const response = await api.get('/admin/spam-stats')
    return response.data
  },
}

export default adminAPI
