# 🚀 Auction Backend API

Backend API cho hệ thống đấu giá trực tuyến - Node.js + Express + Supabase

## 📦 Cài đặt

### 1. Install Dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục Backend:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Secret (đổi thành chuỗi bảo mật mạnh)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (cho CORS)
FRONTEND_URL=http://localhost:5173

# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# OAuth (Optional - nếu dùng Google/Facebook login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OAuth Callback URLs
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
```

**📝 Lưu ý:**
- Lấy Supabase keys từ: Dashboard → Settings → API
- Email App Password: Google Account → Security → 2-Step Verification → App Passwords
- **KHÔNG** commit file `.env` lên Git!

### 3. Chạy Server

```bash
# Development mode (auto-reload với nodemon)
npm run dev

# Production mode
npm start
```

Server chạy tại: **http://localhost:5000**

---

## 🏗 Cấu trúc thư mục

```
Backend/
├── config/
│   ├── supabase.js       # Supabase client
│   ├── passport.js       # OAuth strategies
│   └── mail.js           # Email configuration
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── guestController.js    # Guest/public endpoints
│   ├── bidderController.js   # Bidder features
│   ├── sellerController.js   # Seller features
│   ├── adminController.js    # Admin management
│   └── orderController.js    # Order handling
├── middleware/
│   ├── auth.js                     # JWT verification
│   └── checkSellerExpiration.js   # Seller subscription check
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── guest.js          # Public routes
│   ├── bidder.js         # Bidder routes
│   ├── seller.js         # Seller routes
│   ├── admin.js          # Admin routes
│   └── order.js          # Order routes
├── services/
│   ├── mailService.js         # Email sending
│   └── auctionScheduler.js    # Auto-close auctions
├── utils/
│   ├── emailTemplates.js      # Email HTML templates
│   ├── otpHelper.js           # OTP generation
│   ├── systemSettings.js      # System configs
│   └── upload.js              # File upload handling
├── server.js             # Main entry point
└── package.json
```

---

## 🔌 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /register` - Đăng ký tài khoản
- `POST /verify-email` - Xác thực email với OTP
- `POST /login` - Đăng nhập
- `POST /logout` - Đăng xuất
- `POST /refresh-token` - Làm mới access token
- `POST /forgot-password` - Quên mật khẩu
- `POST /reset-password` - Đặt lại mật khẩu
- `GET /google` - OAuth Google
- `GET /facebook` - OAuth Facebook

### Guest (`/api/guest`)
- `GET /products` - Danh sách sản phẩm đấu giá
- `GET /products/:id` - Chi tiết sản phẩm
- `GET /categories` - Danh mục sản phẩm

### Bidder (`/api/bidder`) - Yêu cầu JWT
- `POST /bids` - Đặt giá thầu
- `GET /my-bids` - Lịch sử đấu giá
- `POST /watchlist` - Theo dõi sản phẩm
- `GET /watchlist` - Danh sách theo dõi
- `POST /auto-bid` - Thiết lập đấu giá tự động

### Seller (`/api/seller`) - Yêu cầu JWT
- `POST /products` - Đăng sản phẩm
- `PUT /products/:id` - Cập nhật sản phẩm
- `DELETE /products/:id` - Xóa sản phẩm
- `GET /my-products` - Sản phẩm của tôi
- `POST /upgrade` - Nâng cấp tài khoản Seller

### Admin (`/api/admin`) - Yêu cầu JWT + Admin role
- `GET /users` - Quản lý người dùng
- `PUT /users/:id` - Cập nhật user
- `GET /products/pending` - Duyệt sản phẩm
- `PUT /products/:id/approve` - Phê duyệt sản phẩm
- `GET /reports` - Xem báo cáo spam

### Orders (`/api/orders`)
- `POST /:orderId/complete` - Hoàn thành đơn hàng
- `POST /:orderId/rate` - Đánh giá người bán

---

## 🔐 Authentication Flow

1. **Register**: Email → Gửi OTP → Xác thực → Tạo tài khoản
2. **Login**: Email/Password → JWT Access Token (1h) + Refresh Token (7 days)
3. **Token Refresh**: Access token hết hạn → Gửi refresh token → Nhận access token mới
4. **OAuth**: Google/Facebook → Auto-create account → Trả về tokens

---

## 📧 Email Templates

Email được gửi cho các trường hợp:
- Xác thực tài khoản (OTP)
- Quên mật khẩu (OTP)
- Thông báo thắng đấu giá
- Thông báo bị overbid
- Câu hỏi từ người mua

---

## ⚙️ Scheduler (Cron Jobs)

Server tự động chạy scheduler để:
- Đóng đấu giá khi hết thời gian
- Xác định người thắng
- Gửi email thông báo
- Xử lý auto-bid

---

## 🐛 Troubleshooting

### Port 5000 đã bị chiếm
```bash
# Đổi port trong .env
PORT=5001
```

### Email không gửi được
- Kiểm tra `EMAIL_USER` và `EMAIL_APP_PASSWORD` đúng
- Bật "Less secure app access" hoặc dùng "App Password"
- Kiểm tra firewall/antivirus không chặn SMTP

### JWT Token invalid
- Kiểm tra `JWT_SECRET` giống nhau giữa các lần khởi động
- Xóa cookies và login lại

### Supabase connection error
- Kiểm tra `SUPABASE_URL` và `SUPABASE_SERVICE_KEY` đúng
- Kiểm tra internet connection
- Xác nhận Supabase project chưa bị pause (free tier)

---

## 📚 Dependencies chính

- `express` - Web framework
- `@supabase/supabase-js` - Database client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `nodemailer` - Email sending
- `passport` - OAuth strategies
- `multer` - File upload
- `express-validator` - Input validation
- `cookie-parser` - Cookie handling

---

## 🚀 Deployment

**Production checklist:**
1. Đổi `NODE_ENV=production`
2. Dùng JWT_SECRET mạnh (ít nhất 32 ký tự)
3. Bật HTTPS
4. Cấu hình CORS chính xác
5. Set up proper logging
6. Use process manager (PM2, Docker)
7. Set up database backup

---

## 📖 API Documentation

Xem chi tiết API endpoints, request/response examples trong các file controller hoặc dùng Postman collection.

---

**Developed by TayDuKy Team**
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "role": "bidder",
    "rating_positive": 0,
    "rating_negative": 0,
    "created_at": "2025-11-01T10:00:00.000Z"
  }
}
```

**Response Error (400):**

```json
{
  "error": "Email đã được sử dụng!"
}
```

---

### 3. Đăng nhập (Login)

```
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response Success (200):**

```json
{
  "message": "Đăng nhập thành công!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "role": "bidder",
    "rating_positive": 0,
    "rating_negative": 0
  }
}
```

**Response Error (401):**

```json
{
  "error": "Email hoặc mật khẩu không đúng!"
}
```

---

### 4. Lấy thông tin Profile (Protected)

```
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "role": "bidder",
    "rating_positive": 0,
    "rating_negative": 0,
    "created_at": "2025-11-01T10:00:00.000Z"
  }
}
```

**Response Error (401):**

```json
{
  "error": "Vui lòng đăng nhập để tiếp tục!"
}
```

---

## 🧪 Test API với cURL

### Test Health:

```bash
curl http://localhost:5000/api/health
```

### Test Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","fullName":"Test User"}'
```

### Test Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Test Profile (cần token):

```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📁 Cấu trúc thư mục

```
Backend/
├── server.js                 # Entry point
├── package.json             # Dependencies
├── .env                     # Environment variables (không commit)
├── .gitignore              # Git ignore rules
├── config/
│   └── supabase.js         # Supabase client config
├── controllers/
│   └── authController.js   # Auth business logic
├── middleware/
│   └── auth.js            # JWT authentication middleware
└── routes/
    └── auth.js            # Auth routes
```

---

## 🔐 Bảo mật

1. **Password Hashing**: Sử dụng bcrypt với 10 salt rounds
2. **JWT Token**: Expire sau 7 ngày
3. **CORS**: Chỉ cho phép Frontend URL được cấu hình
4. **Environment Variables**: Credentials không hard-code
5. **Service Role Key**: Chỉ dùng ở Backend, không expose ra Frontend

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"

```bash
# Đảm bảo đã cài dependencies
npm install
```

### Lỗi: "Supabase connection failed"

```bash
# Kiểm tra SUPABASE_URL và SUPABASE_SERVICE_KEY trong .env
# Đảm bảo đã tạo bảng users trên Supabase
```

### Lỗi: "Port 5000 already in use"

```bash
# Đổi PORT trong .env thành số khác, ví dụ 5001
PORT=5001
```

---

## 📝 Notes

- Backend chạy trên port **5000**
- Frontend chạy trên port **5173** (hoặc 5175)
- JWT token có thời hạn **7 ngày**
- Password phải có ít nhất **6 ký tự**
