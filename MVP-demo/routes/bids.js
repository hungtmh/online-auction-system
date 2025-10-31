const express = require('express');
const router = express.Router();
const db = require('../db-helpers');

// Middleware: check login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập để đấu giá!');
    return res.redirect('/auth/login');
  }
  next();
}

// Place a bid
router.post('/', requireLogin, async (req, res) => {
  const { product_id, bid_amount } = req.body;
  const userId = req.session.user.id;

  try {
    // Get product
    const product = await db.get('SELECT * FROM products WHERE id = ?', [product_id]);
    
    if (!product) {
      req.flash('error', 'Sản phẩm không tồn tại!');
      return res.redirect('/');
    }

    // Check if auction ended
    const now = new Date().toISOString();
    if (now > product.end_time) {
      req.flash('error', 'Phiên đấu giá đã kết thúc!');
      return res.redirect(`/products/${product_id}`);
    }

    // Check if user is seller
    if (product.seller_id === userId) {
      req.flash('error', 'Bạn không thể đấu giá sản phẩm của chính mình!');
      return res.redirect(`/products/${product_id}`);
    }

    // Check bid amount
    const minBid = product.current_price + product.price_step;
    if (parseFloat(bid_amount) < minBid) {
      req.flash('error', `Giá đấu phải ít nhất ${minBid.toLocaleString('vi-VN')} VNĐ`);
      return res.redirect(`/products/${product_id}`);
    }

    // Insert bid
    await db.run(`
      INSERT INTO bids (product_id, bidder_id, bid_amount)
      VALUES (?, ?, ?)
    `, [product_id, userId, bid_amount]);

    // Update product
    await db.run(`
      UPDATE products 
      SET current_price = ?, bid_count = bid_count + 1
      WHERE id = ?
    `, [bid_amount, product_id]);

    req.flash('success', `Đấu giá thành công! Giá hiện tại: ${parseFloat(bid_amount).toLocaleString('vi-VN')} VNĐ`);
    res.redirect(`/products/${product_id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra khi đấu giá!');
    res.redirect(`/products/${product_id}`);
  }
});

module.exports = router;
