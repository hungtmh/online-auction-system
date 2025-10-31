const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db-helpers');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', { title: 'Đăng nhập' });
});

// Login post
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      req.flash('error', 'Email không tồn tại!');
      return res.redirect('/auth/login');
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      req.flash('error', 'Mật khẩu không đúng!');
      return res.redirect('/auth/login');
    }

    // Save to session
    req.session.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    req.flash('success', `Xin chào ${user.full_name}!`);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra!');
    res.redirect('/auth/login');
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', { title: 'Đăng ký' });
});

// Register post
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    // Check if email exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      req.flash('error', 'Email đã được sử dụng!');
      return res.redirect('/auth/register');
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    await db.run(`
      INSERT INTO users (email, password, full_name, role)
      VALUES (?, ?, ?, 'bidder')
    `, [email, hashedPassword, full_name]);

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra khi đăng ký!');
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
