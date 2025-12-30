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
  getSalesStats,
  uploadProductImage,
  getSellerProfile,
  updateSellerProfile,
  uploadSellerAvatar,
  answerBidderQuestion,
  rejectBid,
  getWinnerSummary,
  rateWinner,
  cancelWinnerTransaction,
  reopenAuction,
  getBidRequests,
  updateBidRequestStatus
} from '../controllers/sellerController.js'
import { productImageUpload, avatarImageUpload } from '../utils/upload.js'

const router = express.Router()

// Tất cả routes cần authentication và role = seller
router.use(authenticateToken)
router.use(requireRole('seller'))

router.get('/profile', getSellerProfile)
router.put('/profile', updateSellerProfile)
router.post('/profile/avatar', avatarImageUpload.single('avatar'), uploadSellerAvatar)

/**
 * @route   POST /api/seller/uploads/images
 * @desc    Upload ảnh sản phẩm lên Supabase Storage
 * @access  Private (Seller)
 */
router.post('/uploads/images', productImageUpload.single('image'), uploadProductImage)

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
 * @route   POST /api/seller/products/:productId/bids/:bidId/reject
 * @desc    Từ chối một lượt đặt giá
 * @access  Private (Seller)
 */
router.post('/products/:productId/bids/:bidId/reject', rejectBid)

/**
 * @route   GET /api/seller/stats
 * @desc    Thống kê doanh thu
 * @access  Private (Seller)
 */
router.get('/stats', getSalesStats)

/**
 * @route   POST /api/seller/questions/:questionId/answer
 * @desc    Trả lời câu hỏi từ bidder
 * @access  Private (Seller)
 */
router.post('/questions/:questionId/answer', answerBidderQuestion)

router.get('/products/:id/winner-summary', getWinnerSummary)
router.post('/products/:id/winner/rate', rateWinner)
router.post('/products/:id/winner/cancel', cancelWinnerTransaction)
router.post('/products/:id/reopen', reopenAuction)

// Bidder Permission Requests
router.get('/products/:productId/requests', getBidRequests)
router.post('/requests/:requestId/approve', updateBidRequestStatus)

export default router
