/**
 * ============================================
 * ORDER ROUTES - API hoàn tất đơn hàng
 * ============================================
 */

import { Router } from 'express'
import { param, body, query, validationResult } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import {
  getOrder,
  submitPaymentProof,
  confirmPaymentAndShip,
  confirmDelivery,
  submitRating,
  cancelOrder,
  getChatMessages,
  sendChatMessage,
  getUnreadCount
} from '../controllers/orderController.js'

const router = Router()

// Middleware validate
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }
  next()
}

// ============================================
// ORDER COMPLETION FLOW
// ============================================

/**
 * @route   GET /api/orders/:productId
 * @desc    Lấy thông tin đơn hàng
 */
router.get(
  '/:productId',
  authenticate,
  [param('productId').isUUID().withMessage('Invalid product ID'), validate],
  getOrder
)

/**
 * @route   POST /api/orders/:productId/step1
 * @desc    Bước 1: Buyer cung cấp hoá đơn + địa chỉ
 */
router.post(
  '/:productId/step1',
  authenticate,
  [
    param('productId').isUUID().withMessage('Invalid product ID'),
    body('shipping_address').notEmpty().withMessage('Địa chỉ giao hàng là bắt buộc'),
    body('payment_proof_url').notEmpty().withMessage('Hoá đơn thanh toán là bắt buộc'),
    validate
  ],
  submitPaymentProof
)

/**
 * @route   POST /api/orders/:productId/step2
 * @desc    Bước 2: Seller xác nhận + gửi hoá đơn vận chuyển
 */
router.post(
  '/:productId/step2',
  authenticate,
  [param('productId').isUUID().withMessage('Invalid product ID'), validate],
  confirmPaymentAndShip
)

/**
 * @route   POST /api/orders/:productId/step3
 * @desc    Bước 3: Buyer xác nhận nhận hàng
 */
router.post(
  '/:productId/step3',
  authenticate,
  [param('productId').isUUID().withMessage('Invalid product ID'), validate],
  confirmDelivery
)

/**
 * @route   POST /api/orders/:productId/rate
 * @desc    Bước 4: Đánh giá giao dịch
 */
router.post(
  '/:productId/rate',
  authenticate,
  [
    param('productId').isUUID().withMessage('Invalid product ID'),
    body('rating').isIn(['positive', 'negative']).withMessage('Rating phải là positive hoặc negative'),
    validate
  ],
  submitRating
)

/**
 * @route   POST /api/orders/:productId/cancel
 * @desc    Seller huỷ đơn hàng
 */
router.post(
  '/:productId/cancel',
  authenticate,
  [param('productId').isUUID().withMessage('Invalid product ID'), validate],
  cancelOrder
)

// ============================================
// CHAT
// ============================================

/**
 * @route   GET /api/orders/:productId/chat
 * @desc    Lấy tin nhắn chat
 */
router.get(
  '/:productId/chat',
  authenticate,
  [
    param('productId').isUUID().withMessage('Invalid product ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validate
  ],
  getChatMessages
)

/**
 * @route   POST /api/orders/:productId/chat
 * @desc    Gửi tin nhắn
 */
router.post(
  '/:productId/chat',
  authenticate,
  [param('productId').isUUID().withMessage('Invalid product ID'), validate],
  sendChatMessage
)

/**
 * @route   GET /api/orders/:productId/chat/unread
 * @desc    Đếm tin nhắn chưa đọc
 */
router.get(
  '/:productId/chat/unread',
  authenticate,
  [param('productId').isUUID().withMessage('Invalid product ID'), validate],
  getUnreadCount
)

export default router
