const express = require('express');
const router = express.Router();
const db = require('../db-helpers');

// List products by category
router.get('/category/:id', async (req, res) => {
  const categoryId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [categoryId]);
    
    if (!category) {
      return res.status(404).render('error', { 
        message: 'Danh mục không tồn tại',
        title: '404' 
      });
    }

    const products = await db.all(`
      SELECT p.*, u.full_name as seller_name, c.name as category_name,
             (SELECT full_name FROM users WHERE id = (SELECT bidder_id FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1)) as highest_bidder
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [categoryId, limit, offset]);

    const result = await db.get('SELECT COUNT(*) as total FROM products WHERE category_id = ? AND status = "active"', [categoryId]);
    const totalPages = Math.ceil(result.total / limit);

    res.render('products/list', {
      title: `${category.name} - Danh sách sản phẩm`,
      products,
      category,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      message: 'Lỗi khi tải danh sách sản phẩm',
      title: 'Lỗi' 
    });
  }
});

// Product detail
router.get('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await db.get(`
      SELECT p.*, 
             u.full_name as seller_name, 
             u.rating_positive as seller_positive,
             u.rating_negative as seller_negative,
             c.name as category_name
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    if (!product) {
      return res.status(404).render('error', { 
        message: 'Sản phẩm không tồn tại',
        title: '404' 
      });
    }

    // Get highest bidder info
    const highestBid = await db.get(`
      SELECT b.*, u.full_name, u.rating_positive, u.rating_negative
      FROM bids b
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE b.product_id = ?
      ORDER BY b.bid_amount DESC, b.created_at ASC
      LIMIT 1
    `, [productId]);

    // Get bid history (masked names)
    const bidHistory = await db.all(`
      SELECT b.bid_amount, b.created_at, u.full_name
      FROM bids b
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE b.product_id = ?
      ORDER BY b.bid_amount DESC, b.created_at DESC
      LIMIT 20
    `, [productId]);

    // Mask bidder names
    bidHistory.forEach(bid => {
      if (bid.full_name) {
        bid.masked_name = '****' + bid.full_name.slice(-4);
      }
    });

    // Related products (same category)
    const relatedProducts = await db.all(`
      SELECT p.*, u.full_name as seller_name, c.name as category_name
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
      ORDER BY RANDOM()
      LIMIT 5
    `, [product.category_id, productId]);

    // Suggested bid amount
    const suggestedBid = product.current_price + product.price_step;

    res.render('products/detail', {
      title: product.title,
      product,
      highestBid,
      bidHistory,
      relatedProducts,
      suggestedBid
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      message: 'Lỗi khi tải chi tiết sản phẩm',
      title: 'Lỗi' 
    });
  }
});

module.exports = router;
