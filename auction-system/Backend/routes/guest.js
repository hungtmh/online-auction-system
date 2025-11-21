/**
 * ============================================
 * GUEST ROUTES - KHẢI PHỤ TRÁCH
 * ============================================
 * Routes cho khách chưa đăng nhập
 */

import express from "express";
import { query, param, validationResult } from "express-validator";
import { getProducts, getProductById, searchProducts, getCategories, getFeaturedProducts } from "../controllers/guestController.js";

const router = express.Router();

/**
 * Middleware to validate request
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/guest/products
 * @desc    Lấy danh sách sản phẩm (public)
 * @query   ?page=1&limit=12&category=UUID&status=active
 * @access  Public
 */
router.get("/products", [
  query("page").optional().isInt({ min: 1 }).toInt(), 
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(), 
  query("category").optional().isUUID().withMessage("category must be a valid UUID"), 
  query("status").optional().isIn(["active", "inactive", "draft"]), 
  validate
], getProducts);

/**
 * @route   GET /api/guest/products/:id
 * @desc    Xem chi tiết sản phẩm
 * @access  Public
 */
router.get("/products/:id", [param("id").notEmpty().withMessage("id is required"), validate], getProductById);

/**
 * @route   GET /api/guest/search
 * @desc    Tìm kiếm sản phẩm
 * @query   ?q=keyword&page=1&limit=12
 * @access  Public
 */
router.get("/search", [query("q").notEmpty().withMessage("q is required"), query("page").optional().isInt({ min: 1 }).toInt(), query("limit").optional().isInt({ min: 1 }).toInt(), validate], searchProducts);

/**
 * @route   GET /api/guest/categories
 * @desc    Lấy danh sách danh mục
 * @access  Public
 */
router.get("/categories", getCategories);

/**
 * @route   GET /api/guest/featured
 * @desc    Sản phẩm nổi bật
 * @query   ?type=ending_soon|most_bids|highest_price&limit=6
 * @access  Public
 */
router.get("/featured", [query("type").optional().isIn(["ending_soon", "most_bids", "highest_price"]), query("limit").optional().isInt({ min: 1, max: 50 }).toInt(), validate], getFeaturedProducts);

export default router;
