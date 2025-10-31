const express = require('express');
const router = express.Router();
const db = require('../db-helpers');

// Middleware: check login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập!');
    return res.redirect('/auth/login');
  }
  next();
}

// Profile page
router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const user = await db.get(`
      SELECT * FROM users WHERE id = ?
    `, [userId]);

    // Products I'm bidding on
    const myBids = await db.all(`
      SELECT DISTINCT p.*, 
             (SELECT bid_amount FROM bids WHERE product_id = p.id AND bidder_id = ? ORDER BY bid_amount DESC LIMIT 1) as my_bid,
             (SELECT bid_amount FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1) as highest_bid
      FROM products p
      INNER JOIN bids b ON p.id = b.product_id
      WHERE b.bidder_id = ? AND p.status = 'active'
      ORDER BY p.end_time ASC
    `, [userId, userId]);

    // Products I won (I'm the highest bidder)
    const myWins = await db.all(`
      SELECT p.*,
             (SELECT bid_amount FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC LIMIT 1) as winning_bid
      FROM products p
      WHERE p.id IN (
        SELECT DISTINCT product_id 
        FROM bids 
        WHERE bidder_id = ?
      )
      AND (
        SELECT bidder_id FROM bids WHERE product_id = p.id ORDER BY bid_amount DESC, created_at ASC LIMIT 1
      ) = ?
      ORDER BY p.end_time DESC
    `, [userId, userId]);

    res.render('profile/index', {
      title: 'Hồ sơ cá nhân',
      user,
      myBids,
      myWins
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('/');
  }
});

module.exports = router;
