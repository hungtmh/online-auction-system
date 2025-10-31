const express = require('express');
const router = express.Router();
const db = require('../db-helpers');

// Homepage
router.get('/', async (req, res) => {
  try {
    // Top 5 sản phẩm gần kết thúc
    const endingSoon = await db.all(`
      SELECT p.*, u.full_name as seller_name, c.name as category_name,
             (SELECT full_name FROM users WHERE id = (SELECT bidder_id FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1)) as highest_bidder
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND datetime(p.end_time) > datetime('now')
      ORDER BY datetime(p.end_time) ASC
      LIMIT 5
    `);

    // Top 5 sản phẩm có nhiều lượt đấu giá nhất
    const mostBids = await db.all(`
      SELECT p.*, u.full_name as seller_name, c.name as category_name,
             (SELECT full_name FROM users WHERE id = (SELECT bidder_id FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1)) as highest_bidder
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.bid_count DESC
      LIMIT 5
    `);

    // Top 5 sản phẩm có giá cao nhất
    const highestPrice = await db.all(`
      SELECT p.*, u.full_name as seller_name, c.name as category_name,
             (SELECT full_name FROM users WHERE id = (SELECT bidder_id FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1)) as highest_bidder
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.current_price DESC
      LIMIT 5
    `);

    // Get categories for menu
    const categories = await db.all(`
      SELECT c1.id, c1.name, 
             (SELECT COUNT(*) FROM categories WHERE parent_id = c1.id) as child_count
      FROM categories c1
      WHERE c1.parent_id IS NULL
      ORDER BY c1.name
    `);

    res.render('index', {
      title: 'Trang chủ - Đấu Giá Trực Tuyến',
      endingSoon,
      mostBids,
      highestPrice,
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      message: 'Lỗi khi tải trang chủ',
      title: 'Lỗi' 
    });
  }
});

// Search
router.get('/search', async (req, res) => {
  const { q, category, sort } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, u.full_name as seller_name, c.name as category_name,
           (SELECT full_name FROM users WHERE id = (SELECT bidder_id FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1)) as highest_bidder
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
  `;
  
  const params = [];

  if (q) {
    query += ` AND p.title LIKE ?`;
    params.push(`%${q}%`);
  }

  if (category) {
    query += ` AND p.category_id = ?`;
    params.push(category);
  }

  // Sorting
  if (sort === 'price_asc') {
    query += ` ORDER BY p.current_price ASC`;
  } else if (sort === 'ending_soon') {
    query += ` ORDER BY datetime(p.end_time) ASC`;
  } else {
    query += ` ORDER BY p.created_at DESC`;
  }

  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const products = await db.all(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) as total FROM products p WHERE p.status = 'active'`;
    const countParams = [];
    if (q) {
      countQuery += ` AND p.title LIKE ?`;
      countParams.push(`%${q}%`);
    }
    if (category) {
      countQuery += ` AND p.category_id = ?`;
      countParams.push(category);
    }

    const result = await db.get(countQuery, countParams);
    const total = result.total;
    const totalPages = Math.ceil(total / limit);

    const categories = await db.all('SELECT * FROM categories WHERE parent_id IS NULL');

    res.render('search', {
      title: 'Tìm kiếm sản phẩm',
      products,
      categories,
      query: q || '',
      selectedCategory: category || '',
      currentSort: sort || '',
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      message: 'Lỗi khi tìm kiếm',
      title: 'Lỗi' 
    });
  }
});

module.exports = router;
