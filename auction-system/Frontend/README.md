# ⚛️ Auction Frontend

Frontend web application cho hệ thống đấu giá trực tuyến - React + Vite + TailwindCSS

## 📦 Cài đặt

### 1. Install Dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục Frontend:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000

# Supabase (cho client-side features như storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google reCAPTCHA (Optional - chống spam)
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

**📝 Lưu ý:**
- Vite yêu cầu prefix `VITE_` cho environment variables
- **KHÔNG** commit file `.env` lên Git!

### 3. Chạy Development Server

```bash
# Development mode (hot-reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

App chạy tại: **http://localhost:5173**

---

## 🏗 Cấu trúc thư mục

```
Frontend/
├── public/                   # Static assets
├── src/
│   ├── assets/              # Images, icons
│   ├── components/
│   │   ├── Auth/                 # Login, Register
│   │   ├── BidderDashboard/      # Bidder features
│   │   ├── GuestHomePage/        # Public homepage
│   │   ├── ProductDetail/        # Product detail page
│   │   ├── ProductDetailPage/    # Product sections
│   │   ├── Seller/               # Seller dashboard
│   │   ├── Layout/               # Layout components
│   │   └── common/               # Shared components
│   ├── context/
│   │   ├── AuthContext.jsx       # Auth state management
│   │   └── DialogContext.jsx     # Dialog/modal management
│   ├── hooks/
│   │   └── useCategories.js      # Custom hooks
│   ├── lib/
│   │   └── supabase.js           # Supabase client
│   ├── pages/
│   │   ├── GuestHomePage.jsx        # Landing page
│   │   ├── LoginPage.jsx            # Login
│   │   ├── RegisterPage.jsx         # Register
│   │   ├── BidderDashboard.jsx      # Bidder dashboard
│   │   ├── SellerDashboardPage.jsx  # Seller dashboard
│   │   ├── AdminDashboard.jsx       # Admin panel
│   │   ├── ProductDetailPage.jsx    # Product details
│   │   ├── AuctionListPage.jsx      # Browse auctions
│   │   └── ...
│   ├── services/
│   │   ├── api.js           # Axios instance + interceptors
│   │   ├── guestAPI.js      # Guest endpoints
│   │   ├── bidderAPI.js     # Bidder endpoints
│   │   ├── sellerAPI.js     # Seller endpoints
│   │   ├── adminAPI.js      # Admin endpoints
│   │   └── orderAPI.js      # Order endpoints
│   ├── App.jsx              # Main app + routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles + Tailwind
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
└── package.json
```

---

## 🎨 Features

### Public (Guest) Features
- 🏠 Browse auctions and products
- 🔍 Search and filter products
- 📱 View product details
- 📊 View categories

### Bidder Features
- 🎯 Place bids on products
- 📋 View bidding history
- ⭐ Add products to watchlist
- 🤖 Auto-bid functionality
- 💬 Ask questions to sellers
- 💳 Complete orders and rate sellers

### Seller Features
- ➕ Create auction listings
- ✏️ Edit/delete products
- 📦 Manage products
- 💼 View seller profile
- 📧 Answer buyer questions
- 📈 View sales statistics

### Admin Features
- 👥 Manage users
- ✅ Approve products
- 🚫 Handle spam reports
- 📊 View system statistics

---

## 🔐 Authentication

App sử dụng JWT-based authentication với:
- **Access Token** (1 hour) - Stored in memory
- **Refresh Token** (7 days) - Stored in HTTP-only cookie
- Auto-refresh token khi hết hạn
- Persistent login với refresh token

**Auth Flow:**
1. User login → Nhận access + refresh token
2. Mỗi request → Gửi access token trong header
3. Access token hết hạn → Auto gọi `/refresh-token`
4. Logout → Clear tokens

---

## 🛣 Routing

| Route | Component | Access |
|-------|-----------|--------|
| `/` | GuestHomePage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/forgot-password` | ForgotPasswordPage | Public |
| `/product/:id` | ProductDetailPage | Public/Authenticated |
| `/auctions` | AuctionListPage | Public |
| `/bidder/dashboard` | BidderDashboard | Bidder only |
| `/seller/dashboard` | SellerDashboardPage | Seller only |
| `/admin/dashboard` | AdminDashboard | Admin only |
| `/winner-checkout/:orderId` | WinnerCheckoutPage | Winner only |
| `/orders/:orderId/complete` | OrderCompletionPage | Authenticated |

---

## 🎨 Styling

**TailwindCSS** - Utility-first CSS framework

Custom theme configuration in [tailwind.config.js](tailwind.config.js):
- Custom colors
- Custom breakpoints
- Custom animations
- Dark mode support (optional)

---

## 📡 API Integration

Tất cả API calls được xử lý qua Axios instance trong `services/api.js`:

```javascript
// Axios interceptors tự động:
// - Thêm JWT token vào headers
// - Xử lý token refresh khi 401
// - Xử lý errors globally
```

**Service files:**
- `guestAPI.js` - Public endpoints
- `bidderAPI.js` - Bidder features
- `sellerAPI.js` - Seller features
- `adminAPI.js` - Admin features
- `orderAPI.js` - Order management

---

## 🐛 Troubleshooting

### API calls thất bại
- Kiểm tra Backend đang chạy tại `VITE_API_BASE_URL`
- Kiểm tra CORS đã được bật trong Backend
- Xem Network tab trong DevTools để debug

### Build errors
```bash
# Clear cache và reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vite port đã bị chiếm
```bash
# Chạy với port khác
npm run dev -- --port 3000
```

### Hot reload không hoạt động
- Restart dev server
- Kiểm tra file watchers limit (Linux)

---

## 📚 Dependencies chính

- `react` + `react-dom` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `@supabase/supabase-js` - Supabase client
- `react-google-recaptcha` - reCAPTCHA
- `quill` - Rich text editor (for product description)

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output trong thư mục `dist/`

### Deploy options:
- **Vercel**: Auto-deploy from Git
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Set base in `vite.config.js`
- **AWS S3 + CloudFront**: Upload `dist/` to S3

**Production checklist:**
1. Set production API URL in `.env`
2. Enable HTTPS
3. Optimize images
4. Enable compression (gzip/brotli)
5. Set proper cache headers
6. Add error tracking (Sentry)

---

**Developed by TayDuKy Team**
