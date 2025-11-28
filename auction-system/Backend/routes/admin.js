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
  unbanUser,
  getAllProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getUpgradeRequests,
  approveUpgrade,
  rejectUpgrade,
  getSystemStats,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getBidHistory,
  cancelBid,
  resolveDispute,
  getSystemSettings,
  updateSystemSettings,
  // Spam Management
  getSpamReports,
  getSpamReportById,
  resolveSpamReport,
  dismissSpamReport,
  getSpamStats
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
 * @route   POST /api/admin/users/:id/unban
 * @desc    Gỡ cấm user (hoàn tác)
 * @access  Private (Admin)
 */
router.post('/users/:id/unban', unbanUser)

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

// ============= CATEGORY MANAGEMENT =============

/**
 * @route   GET /api/admin/categories
 * @desc    Lấy tất cả categories
 * @access  Private (Admin)
 */
router.get('/categories', getAllCategories)

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Chi tiết category
 * @access  Private (Admin)
 */
router.get('/categories/:id', getCategoryById)

/**
 * @route   POST /api/admin/categories
 * @desc    Tạo category mới
 * @body    { name, slug, description, is_active }
 * @access  Private (Admin)
 */
router.post('/categories', createCategory)

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Cập nhật category
 * @body    { name, slug, description, is_active }
 * @access  Private (Admin)
 */
router.put('/categories/:id', updateCategory)

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Xóa category (không được xóa nếu có sản phẩm)
 * @access  Private (Admin)
 */
router.delete('/categories/:id', deleteCategory)

// ============= BID MANAGEMENT =============

/**
 * @route   GET /api/admin/bids
 * @desc    Lấy lịch sử đấu giá
 * @access  Private (Admin)
 */
router.get('/bids', getBidHistory)

/**
 * @route   POST /api/admin/bids/:id/cancel
 * @desc    Hủy bid (xử lý gian lận)
 * @access  Private (Admin)
 */
router.post('/bids/:id/cancel', cancelBid)

/**
 * @route   POST /api/admin/bids/:id/resolve-dispute
 * @desc    Giải quyết tranh chấp
 * @access  Private (Admin)
 */
router.post('/bids/:id/resolve-dispute', resolveDispute)

// ============= SYSTEM STATS =============

/**
 * @route   GET /api/admin/stats
 * @desc    Thống kê hệ thống
 * @access  Private (Admin)
 */
router.get('/stats', getSystemStats)

// ============= SYSTEM SETTINGS =============

/**
 * @route   GET /api/admin/settings
 * @desc    Lấy cài đặt hệ thống
 * @access  Private (Admin)
 */
router.get('/settings', getSystemSettings)

/**
 * @route   PUT /api/admin/settings
 * @desc    Cập nhật cài đặt hệ thống
 * @body    { key: value }
 * @access  Private (Admin)
 */
router.put('/settings', updateSystemSettings)

// ============= SPAM MANAGEMENT =============

/**
 * @route   GET /api/admin/spam-reports
 * @desc    Lấy danh sách báo cáo spam
 * @query   ?status=pending|resolved|dismissed&type=user|product|bid&page=1&limit=20
 * @access  Private (Admin)
 */
router.get('/spam-reports', getSpamReports)

/**
 * @route   GET /api/admin/spam-reports/:id
 * @desc    Chi tiết báo cáo spam
 * @access  Private (Admin)
 */
router.get('/spam-reports/:id', getSpamReportById)

/**
 * @route   POST /api/admin/spam-reports/:id/resolve
 * @desc    Xử lý báo cáo spam (xác nhận là spam)
 * @body    { action: 'warn'|'ban_user'|'delete_content'|'ban_and_delete', admin_note: 'ghi chú' }
 * @access  Private (Admin)
 */
router.post('/spam-reports/:id/resolve', resolveSpamReport)

/**
 * @route   POST /api/admin/spam-reports/:id/dismiss
 * @desc    Bỏ qua báo cáo spam (không phải spam)
 * @body    { admin_note: 'lý do bỏ qua' }
 * @access  Private (Admin)
 */
router.post('/spam-reports/:id/dismiss', dismissSpamReport)

/**
 * @route   GET /api/admin/spam-stats
 * @desc    Thống kê spam
 * @access  Private (Admin)
 */
router.get('/spam-stats', getSpamStats)

export default router
