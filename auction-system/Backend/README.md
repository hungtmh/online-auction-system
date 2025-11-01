# 🚀 Auction Backend API

Backend API cho hệ thống đấu giá trực tuyến, sử dụng Node.js + Express + Supabase.

## 📋 Cài đặt

### 1. Cài dependencies
```bash
cd Backend
npm install
```

### 2. Cấu hình Environment Variables

Cập nhật file `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://ojbcqlntvkdpdetmttuu.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here  # ⚠️ Cần thay đổi!

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**⚠️ LƯU Ý:** 
- Lấy `SUPABASE_SERVICE_KEY` từ: Supabase Dashboard → Settings → API → `service_role` key
- **KHÔNG** commit file `.env` lên Git!

### 3. Tạo bảng trên Supabase

Xem file `DATABASE-SETUP.md` để có SQL script tạo bảng `users`.

### 4. Chạy server

```bash
# Development mode (auto-restart khi có thay đổi)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: **http://localhost:5000**

---

## 🔌 API Endpoints

### 1. Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Auction Backend API is running!",
  "timestamp": "2025-11-01T10:00:00.000Z"
}
```

---

### 2. Đăng ký (Register)
```
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "fullName": "Nguyễn Văn A"
}
```

**Response Success (201):**
```json
{
  "message": "Đăng ký thành công!",
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
