const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const moment = require('moment');
const methodOverride = require('method-override');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Session
app.use(session({
  secret: 'auction-secret-mvp-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

app.use(flash());

// Global variables cho views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.moment = moment;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/bids', require('./routes/bids'));
app.use('/profile', require('./routes/profile'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Trang không tồn tại',
    title: '404 - Not Found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Có lỗi xảy ra!',
    title: 'Lỗi hệ thống' 
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🎯 AUCTION MVP DEMO RUNNING                     ║
║   📍 http://localhost:${PORT}                        ║
║   🚀 Nhấn Ctrl+C để tắt server                    ║
╚═══════════════════════════════════════════════════╝
  `);
});
