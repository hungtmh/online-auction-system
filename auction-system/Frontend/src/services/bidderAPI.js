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
   * Đặt giá đấu
   * @param {string} productId
   * @param {number} bidAmount
   */
  placeBid: async (productId, bidAmount) => {
  const response = await api.post('/bidder/bids', {
      product_id: productId,
      bid_amount: bidAmount
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
  }
}

export default bidderAPI
