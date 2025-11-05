/**
 * ============================================
 * ADMIN ROUTES - THẮNG PHỤ TRÁCH
 * ============================================
 * Routes cho quản trị viên
 */

import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  banUser,
  deleteUser,
  getAllProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getUpgradeRequests,
  approveUpgrade,
  rejectUpgrade,
  getSystemStats
} from '../controllers/adminController.js'

const router = express.Router()

// Tất cả routes cần authentication và role = admin
router.use(authenticateToken)
router.use(requireRole('admin'))

// ============= USER MANAGEMENT =============

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách users
 * @query   ?role=bidder|seller&page=1&limit=20
 * @access  Private (Admin)
 */
router.get('/users', getAllUsers)

/**
 * @route   GET /api/admin/users/:id
 * @desc    Chi tiết user
 * @access  Private (Admin)
 */
router.get('/users/:id', getUserById)

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Thay đổi role
 * @body    { role: 'guest|bidder|seller|admin' }
 * @access  Private (Admin)
 */
router.put('/users/:id/role', updateUserRole)

/**
 * @route   POST /api/admin/users/:id/ban
 * @desc    Cấm user
 * @access  Private (Admin)
 */
router.post('/users/:id/ban', banUser)

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa user
 * @access  Private (Admin)
 */
router.delete('/users/:id', deleteUser)

// ============= PRODUCT MANAGEMENT =============

/**
 * @route   GET /api/admin/products
 * @desc    Lấy tất cả sản phẩm
 * @query   ?status=pending|active|sold&page=1&limit=20
 * @access  Private (Admin)
 */
router.get('/products', getAllProducts)

/**
 * @route   POST /api/admin/products/:id/approve
 * @desc    Duyệt sản phẩm
 * @access  Private (Admin)
 */
router.post('/products/:id/approve', approveProduct)

/**
 * @route   POST /api/admin/products/:id/reject
 * @desc    Từ chối sản phẩm
 * @body    { reason: 'lý do' }
 * @access  Private (Admin)
 */
router.post('/products/:id/reject', rejectProduct)

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Xóa sản phẩm vi phạm
 * @access  Private (Admin)
 */
router.delete('/products/:id', deleteProduct)

// ============= UPGRADE REQUESTS =============

/**
 * @route   GET /api/admin/upgrades
 * @desc    Lấy yêu cầu nâng cấp
 * @query   ?status=pending|approved|rejected
 * @access  Private (Admin)
 */
router.get('/upgrades', getUpgradeRequests)

/**
 * @route   POST /api/admin/upgrades/:id/approve
 * @desc    Duyệt yêu cầu nâng cấp
 * @access  Private (Admin)
 */
router.post('/upgrades/:id/approve', approveUpgrade)

/**
 * @route   POST /api/admin/upgrades/:id/reject
 * @desc    Từ chối yêu cầu nâng cấp
 * @access  Private (Admin)
 */
router.post('/upgrades/:id/reject', rejectUpgrade)

// ============= SYSTEM STATS =============

/**
 * @route   GET /api/admin/stats
 * @desc    Thống kê hệ thống
 * @access  Private (Admin)
 */
router.get('/stats', getSystemStats)

export default router
