/**
 * ============================================
 * BIDDER API SERVICE - KHOA PHỤ TRÁCH
 * ============================================
 * API calls cho Bidder Dashboard
 */

import api from './api'

const bidderAPI = {
  /**
   * Lấy danh sách sản phẩm đấu giá
   * @param {Object} params - { page, limit, category, sort }
   */
  getAuctionProducts: async (params = {}) => {
  const response = await api.get('/bidder/products', { params })
    return response.data
  },

  /**
   * Đặt giá tự động (Auto Bidding)
   * @param {string} productId
   * @param {number} maxBid - Giá tối đa sẵn sàng trả
   */
  placeBid: async (productId, maxBid) => {
    const response = await api.post('/bidder/bids', {
      product_id: productId,
      max_bid: maxBid
    })
    return response.data
  },

  /**
   * Lấy lịch sử đấu giá của tôi
   */
  getMyBids: async () => {
  const response = await api.get('/bidder/bids/my')
    return response.data
  },

  /**
   * Thêm sản phẩm vào watchlist
   * @param {string} productId
   */
  addToWatchlist: async (productId) => {
  const response = await api.post('/bidder/watchlist', {
      product_id: productId
    })
    return response.data
  },

  /**
   * Xóa sản phẩm khỏi watchlist
   * @param {string} productId
   */
  removeFromWatchlist: async (productId) => {
  const response = await api.delete(`/bidder/watchlist/${productId}`)
    return response.data
  },

  /**
   * Lấy danh sách watchlist
   */
  getWatchlist: async () => {
  const response = await api.get('/bidder/watchlist')
    return response.data
  },

  /**
   * Lấy lịch sử giá đấu của sản phẩm
   * @param {string} productId
   */
  getBidHistory: async (productId) => {
  const response = await api.get(`/bidder/products/${productId}/bids`)
    return response.data
  },

  /**
   * Gửi câu hỏi cho người bán
   * @param {string} productId
   * @param {string} question
   */
  askSellerQuestion: async (productId, question) => {
  const response = await api.post(`/bidder/products/${productId}/questions`, {
      question
    })
    return response.data
  },

  /**
   * Lấy thông tin checkout của sản phẩm thắng cuộc
   * @param {string} productId
   */
  getCheckoutOrder: async (productId) => {
  const response = await api.get(`/bidder/orders/${productId}`)
    return response.data
  },

  /**
   * Lưu thông tin checkout (địa chỉ, chứng từ)
   * @param {Object} payload - { product_id, shipping_address, payment_proof_url? }
   */
  submitCheckoutOrder: async (payload) => {
  const response = await api.post('/bidder/orders', payload)
    return response.data
  },

  uploadPaymentProof: async (file) => {
    const formData = new FormData()
    formData.append('proof', file)
    const response = await api.post('/bidder/uploads/payment-proof', formData)
    return response.data
  },

  /**
   * Cập nhật hồ sơ bidder
   * @param {Object} payload - { full_name, phone, address, date_of_birth }
   */
  updateProfile: async (payload) => {
    const response = await api.put('/bidder/profile', payload)
    return response.data
  },

  /**
   * Upload ảnh đại diện
   * @param {File} file
   */
  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/bidder/profile/avatar', formData)
    return response.data
  },

  /**
   * Kiểm tra trạng thái bid của user cho sản phẩm
   * @param {string} productId
   */
  getUserBidStatus: async (productId) => {
    const response = await api.get(`/bidder/products/${productId}/bid-status`)
    return response.data
  },

  /**
   * Lấy thông tin người đang thắng đấu giá
   * @param {string} productId
   */
  getCurrentWinner: async (productId) => {
    const response = await api.get(`/bidder/products/${productId}/current-winner`)
    return response.data
  },

  /**
   * Lấy trạng thái auto bid của tôi cho sản phẩm
   * @param {string} productId
   */
  getMyAutoBidStatus: async (productId) => {
    const response = await api.get(`/bidder/bids/my/status/${productId}`)
    return response.data
  }
}

export default bidderAPI
