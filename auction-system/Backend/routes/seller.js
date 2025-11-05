/**
 * ============================================
 * SELLER ROUTES - CƯỜNG PHỤ TRÁCH
 * ============================================
 * Routes cho người bán
 */

import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getProductBids,
  getSalesStats
} from '../controllers/sellerController.js'

const router = express.Router()

// Tất cả routes cần authentication và role = seller
router.use(authenticateToken)
router.use(requireRole('seller'))

/**
 * @route   POST /api/seller/products
 * @desc    Đăng sản phẩm mới
 * @body    { title, description, category_id, starting_price, step_price, buy_now_price, end_time, image_url, auto_renew }
 * @access  Private (Seller)
 */
router.post('/products', createProduct)

/**
 * @route   GET /api/seller/products
 * @desc    Lấy danh sách sản phẩm của tôi
 * @query   ?status=pending|active|sold&page=1&limit=12
 * @access  Private (Seller)
 */
router.get('/products', getMyProducts)

/**
 * @route   PUT /api/seller/products/:id
 * @desc    Cập nhật sản phẩm
 * @access  Private (Seller)
 */
router.put('/products/:id', updateProduct)

/**
 * @route   DELETE /api/seller/products/:id
 * @desc    Xóa sản phẩm
 * @access  Private (Seller)
 */
router.delete('/products/:id', deleteProduct)

/**
 * @route   GET /api/seller/products/:id/bids
 * @desc    Xem danh sách giá đấu của sản phẩm
 * @access  Private (Seller)
 */
router.get('/products/:id/bids', getProductBids)

/**
 * @route   GET /api/seller/stats
 * @desc    Thống kê doanh thu
 * @access  Private (Seller)
 */
router.get('/stats', getSalesStats)

export default router
