/**
 * ============================================
 * GUEST API SERVICE - KHẢI PHỤ TRÁCH
 * ============================================
 * API calls cho Guest Homepage
 */

import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

const guestAPI = {
  /**
   * Lấy danh sách sản phẩm
   * @param {Object} params - { page, limit, category, status }
   */
  getProducts: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/guest/products`, { params });
    return response.data;
  },

  /**
   * Lấy chi tiết sản phẩm
   * @param {string} productId
   */

  getProductById: async (productId) => {
    const response = await axios.get(`${API_BASE}/guest/products/${productId}`);
    return response.data;
  },

  /**
   * Tìm kiếm sản phẩm
   * @param {string} keyword
   * @param {Object} params - { page, limit }
   */

  searchProducts: async (keyword, params = {}) => {
    const response = await axios.get(`${API_BASE}/guest/search`, {
      params: { q: keyword, ...params },
    });
    return response.data;
  },

  getCategories: async () => {
    const response = await axios.get(`${API_BASE}/guest/categories`);
    return response.data;
  },

  /**
   * Lấy sản phẩm nổi bật (tất cả loại trong 1 request)
   * Trả về: { ending_soon: [], most_bids: [], highest_price: [] }
   */
  getFeaturedProducts: async () => {
    const response = await axios.get(`${API_BASE}/guest/featured`);
    return response.data;
  },

  /**
   * Lấy thông tin người bán công khai
   * @param {string} sellerId
   */
  getSellerProfile: async (sellerId) => {
    const response = await axios.get(`${API_BASE}/guest/sellers/${sellerId}`);
    return response.data;
  }
};

export default guestAPI;
