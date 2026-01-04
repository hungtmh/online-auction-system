/**
 * ============================================
 * BIDDER ROUTES - KHOA PHỤ TRÁCH
 * ============================================
 * Routes cho người đấu giá
 */

import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  getAuctionProducts,
  placeBid,
  getMyBids,
  getMyAutoBidStatus,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getBidHistory,
  askSellerQuestion,
  getCheckoutOrder,
  upsertCheckoutOrder,
  uploadPaymentProofImage,
  updateBidderProfile,
  uploadBidderAvatar,
  getUserBidStatus,
  getCurrentWinner,
  requestUpgrade,
  getUpgradeRequestStatus,
  getMyRatings
} from '../controllers/bidderController.js'
import { paymentProofUpload, avatarImageUpload } from '../utils/upload.js'

const router = express.Router()

// Tất cả routes cần authentication và role = bidder hoặc seller
// Seller thừa hưởng tất cả tính năng của bidder
router.use(authenticateToken)
router.use(requireRole('bidder', 'seller'))

/**
 * @route   GET /api/bidder/products
 * @desc    Lấy danh sách sản phẩm đấu giá
 * @query   ?page=1&limit=12&category=1&sort=ending_soon
 * @access  Private (Bidder)
 */
router.get('/products', getAuctionProducts)

/**
 * @route   POST /api/bidder/bids
 * @desc    Đặt giá tự động (Auto Bidding)
 * @body    { product_id, max_bid }
 * @access  Private (Bidder)
 */
router.post('/bids', placeBid)

/**
 * @route   GET /api/bidder/bids/my
 * @desc    Lịch sử đấu giá của tôi
 * @access  Private (Bidder)
 */
router.get('/bids/my', getMyBids)

/**
 * @route   GET /api/bidder/bids/my/status/:productId
 * @desc    Lấy trạng thái auto bid của tôi cho sản phẩm
 * @access  Private (Bidder)
 */
router.get('/bids/my/status/:productId', getMyAutoBidStatus)

/**
 * @route   GET /api/bidder/products/:id/bid-status
 * @desc    Kiểm tra trạng thái bid của user
 * @access  Private (Bidder)
 */
router.get('/products/:id/bid-status', getUserBidStatus)

/**
 * @route   GET /api/bidder/products/:id/current-winner
 * @desc    Lấy thông tin người đang thắng
 * @access  Private (Bidder)
 */
router.get('/products/:id/current-winner', getCurrentWinner)

/**
 * @route   POST /api/bidder/watchlist
 * @desc    Thêm vào watchlist
 * @body    { product_id }
 * @access  Private (Bidder)
 */
router.post('/watchlist', addToWatchlist)

/**
 * @route   DELETE /api/bidder/watchlist/:productId
 * @desc    Xóa khỏi watchlist
 * @access  Private (Bidder)
 */
router.delete('/watchlist/:productId', removeFromWatchlist)

/**
 * @route   GET /api/bidder/watchlist
 * @desc    Lấy danh sách watchlist
 * @access  Private (Bidder)
 */
router.get('/watchlist', getWatchlist)

/**
 * @route   GET /api/bidder/products/:id/bids
 * @desc    Lịch sử giá đấu của sản phẩm
 * @access  Private (Bidder)
 */
router.get('/products/:id/bids', getBidHistory)

/**
 * @route   POST /api/bidder/products/:id/questions
 * @desc    Gửi câu hỏi cho người bán
 * @access  Private (Bidder)
 */
router.post('/products/:id/questions', askSellerQuestion)

/**
 * Checkout routes
 */
router.get('/orders/:productId', getCheckoutOrder)
router.post('/orders', upsertCheckoutOrder)
router.post('/uploads/payment-proof', paymentProofUpload.single('proof'), uploadPaymentProofImage)

/**
 * @route   PUT /api/bidder/profile
 * @desc    Cập nhật hồ sơ bidder
 * @access  Private (Bidder)
 */
router.put('/profile', updateBidderProfile)

/**
 * @route   POST /api/bidder/profile/avatar
 * @desc    Upload ảnh đại diện bidder
 * @access  Private (Bidder)
 */
router.post('/profile/avatar', avatarImageUpload.single('avatar'), uploadBidderAvatar)

/**
 * @route   POST /api/bidder/upgrade-request
 * @desc    Gửi yêu cầu nâng cấp lên Seller
 * @access  Private (Bidder)
 */
router.post('/upgrade-request', requestUpgrade)

/**
 * @route   GET /api/bidder/upgrade-request/status
 * @desc    Kiểm tra trạng thái yêu cầu nâng cấp
 * @access  Private (Bidder)
 */
router.get('/upgrade-request/status', getUpgradeRequestStatus)

/**
 * @route   GET /api/bidder/ratings
 * @desc    Lấy danh sách đánh giá của tôi
 * @access  Private (Bidder)
 */
router.get('/ratings', getMyRatings)

export default router
