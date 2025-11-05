/**
 * ============================================
 * GUEST ROUTES - KHẢI PHỤ TRÁCH
 * ============================================
 * Routes cho khách chưa đăng nhập
 */

import express from 'express'
import {
  getProducts,
  getProductById,
  searchProducts,
  getCategories,
  getFeaturedProducts
} from '../controllers/guestController.js'

const router = express.Router()

/**
 * @route   GET /api/guest/products
 * @desc    Lấy danh sách sản phẩm (public)
 * @query   ?page=1&limit=12&category=1&status=active
 * @access  Public
 */
router.get('/products', getProducts)

/**
 * @route   GET /api/guest/products/:id
 * @desc    Xem chi tiết sản phẩm
 * @access  Public
 */
router.get('/products/:id', getProductById)

/**
 * @route   GET /api/guest/search
 * @desc    Tìm kiếm sản phẩm
 * @query   ?q=keyword&page=1&limit=12
 * @access  Public
 */
router.get('/search', searchProducts)

/**
 * @route   GET /api/guest/categories
 * @desc    Lấy danh sách danh mục
 * @access  Public
 */
router.get('/categories', getCategories)

/**
 * @route   GET /api/guest/featured
 * @desc    Sản phẩm nổi bật
 * @query   ?type=ending_soon|most_bids|highest_price&limit=6
 * @access  Public
 */
router.get('/featured', getFeaturedProducts)

export default router
