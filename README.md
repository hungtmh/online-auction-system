# 🏆 Online Auction System

Hệ thống đấu giá trực tuyến đầy đủ tính năng với React + Node.js + Supabase PostgreSQL.

## 🎯 Tính năng chính

- **👤 Bidder (Người đấu giá)**: Tìm kiếm, đấu giá sản phẩm, theo dõi đấu giá, xem lịch sử
- **🏪 Seller (Người bán)**: Đăng sản phẩm, quản lý đấu giá, xử lý đơn hàng
- **⚙️ Admin**: Quản lý người dùng, phê duyệt sản phẩm, xử lý báo cáo
- **🔐 Authentication**: JWT + Refresh Token, OAuth (Google/Facebook)
- **📧 Email**: Xác thực tài khoản, OTP, thông báo đấu giá
- **💳 Payment**: Tích hợp thanh toán và xử lý đơn hàng

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, React Router
- **Backend**: Node.js, Express, JWT, Passport
- **Database**: Supabase PostgreSQL
- **Email**: Nodemailer với Gmail SMTP

## 📁 Cấu trúc dự án

```
online-auction-system/
├── auction-system/
│   ├── Backend/          # Node.js API Server
│   └── Frontend/         # React Web App
├── package.json          # Root workspace config
└── README.md             # Tài liệu này
```

---

## 🚀 Hướng dẫn cài đặt

### Bước 1: Cài đặt Database (Supabase)

1. **Tạo project trên Supabase**
   - Truy cập [supabase.com](https://supabase.com)
   - Tạo project mới và lưu lại:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_KEY`

2. **Chạy SQL**
   
   Trong Supabase Dashboard → SQL Editor, chạy file db.sql

### Bước 2: Cài đặt Backend

```bash
cd auction-system/Backend
npm install
```

**Cấu hình `.env` file:**
   
   Đã gửi đính kèm trong thư mục src.zip

**Chạy Backend:**

```bash
npm run dev    # Development mode (auto-reload)
npm start      # Production mode
```

Backend chạy tại: **http://localhost:5000**

### Bước 3: Cài đặt Frontend

```bash
cd auction-system/Frontend
npm install
```

**Cấu hình `.env` file:**
   
   Đã gửi đính kèm trong thư mục src.zip

**Chạy Frontend:**

```bash
npm run dev    # Development mode
npm run build  # Build for production
```

Frontend chạy tại: **http://localhost:5173**

---

## 🔧 Troubleshooting

### Backend không start được
- Kiểm tra tất cả biến trong `.env` đã được cấu hình đúng
- Xác nhận Supabase đang hoạt động
- Chạy `npm install` lại nếu thiếu dependencies

### Frontend không kết nối được Backend
- Kiểm tra Backend đang chạy tại port 5000
- Xác nhận `VITE_API_BASE_URL` trong Frontend `.env` đúng
- Kiểm tra CORS settings trong Backend

### Email không gửi được
- Kiểm tra `EMAIL_USER` và `EMAIL_APP_PASSWORD` đúng
- Bật "App Password" trong Google Account Security
- Kiểm tra Gmail SMTP không bị chặn

### Database lỗi
- Kiểm tra Supabase project còn hoạt động
- Xác nhận đã chạy hết SQL migrations
- Kiểm tra `SUPABASE_SERVICE_KEY` có quyền đầy đủ

---

## 📚 Tài liệu chi tiết

- **Backend API**: Xem [Backend/README.md](auction-system/Backend/README.md)
- **Frontend App**: Xem [Frontend/README.md](auction-system/Frontend/README.md)

---

## 👥 Team

Dự án phát triển bởi nhóm TayDuKy

## 📄 License

ISC License
|-----------|-----------|----------|
| Node.js | 22.20.0 | Runtime |
| Express | 4.18.2 | Web framework |
| jsonwebtoken | 9.0.2 | Tạo & verify JWT tokens |
| bcryptjs | 2.4.3 | Hash password |
| cookie-parser | 1.4.7 | Parse cookies |
| @supabase/supabase-js | 2.49.3 | Database client |

### **Database**
| Công nghệ | Mục đích |
|-----------|----------|
| Supabase PostgreSQL | Database chính |
| Supabase Auth | Quản lý users (chỉ dùng database, không dùng Auth SDK) |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                      │
│  - UI Components (Login, Register, Dashboard)          │
│  - Axios Client với Interceptors                       │
│  - React Router (routing)                              │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTP/HTTPS
                    (Authorization: Bearer <token>)
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express)                     │
│  - Routes: /api/auth/*                                  │
│  - Controllers: authController.js                       │
│  - Middleware: authenticate() - verify JWT             │
└─────────────────────────────────────────────────────────┘
                         ↕ SQL Queries
┌─────────────────────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)             │
│  - auth.users: Email, password_hash (bcrypt)            │
│  - profiles: User info, role, ratings                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Flow xác thực (Authentication)

### **1️⃣ Đăng ký (Register)**

```
┌──────────────────────────────────────────────────────────┐
│ Frontend: User điền form đăng ký                         │
│ (email, password, fullName)                              │
└──────────────────────────────────────────────────────────┘
                      ↓
           POST /api/auth/register
           Body: { email, password, full_name }
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: authController.js → register()                  │
└──────────────────────────────────────────────────────────┘
  ❶ Validate input (email, password, full_name)
  ❷ Hash password: bcrypt.hash(password, 10)
  ❸ Tạo user trong Supabase:
     supabase.auth.admin.createUser({
       email,
       password,
       email_confirm: false,  // ← Bắt verify email
       user_metadata: { full_name, password_hash }
     })
  ❹ Supabase tự động:
     - Tạo user trong auth.users
     - Gửi email verification
     - Trigger tạo profile trong bảng profiles
  ❺ Response: { success: true, requireEmailVerification: true }
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: Hiển thị modal "Kiểm tra email để xác nhận"   │
└──────────────────────────────────────────────────────────┘
```

### **2️⃣ Đăng nhập (Login)**

```
┌──────────────────────────────────────────────────────────┐
│ Frontend: User điền email + password                     │
└──────────────────────────────────────────────────────────┘
                      ↓
           POST /api/auth/login
           Body: { email, password }
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: authController.js → login()                     │
└──────────────────────────────────────────────────────────┘
  ❶ Tìm user theo email:
     supabase.auth.admin.listUsers()
     users.find(u => u.email === email)
  
  ❷ Kiểm tra email đã verify chưa:
     if (!user.email_confirmed_at) {
       return 403 "Vui lòng xác nhận email"
     }
  
  ❸ Lấy password hash từ user_metadata:
     passwordHash = user.user_metadata.password_hash
  
  ❹ So sánh password:
     bcrypt.compare(password, passwordHash)
     → true ✅ / false ❌
  
  ❺ Tạo JWT tokens:
     accessToken = jwt.sign(
       { userId, email },
       JWT_SECRET,
       { expiresIn: '15m' }  // ← Hết hạn sau 15 phút
     )
     
     refreshToken = jwt.sign(
       { userId },
       JWT_REFRESH_SECRET,
       { expiresIn: '7d' }   // ← Hết hạn sau 7 ngày
     )
  
  ❻ Lưu refresh token vào HTTP-only cookie:
     res.cookie('refreshToken', refreshToken, {
       httpOnly: true,    // ← JavaScript không đọc được
       secure: false,     // ← true khi HTTPS (production)
       sameSite: 'strict',
       maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
     })
  
  ❼ Response:
     {
       success: true,
       accessToken: "eyJhbGci...",
       user: { id, email, full_name }
     }
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: Login.jsx                                      │
└──────────────────────────────────────────────────────────┘
  ❽ Lưu access token vào memory:
     setAccessToken(data.accessToken)
  
  ❾ Redirect sang Dashboard:
     window.location.href = '/dashboard'
```

### **3️⃣ Gọi API với Access Token**

```
┌──────────────────────────────────────────────────────────┐
│ Frontend: User click "Xem hồ sơ"                         │
└──────────────────────────────────────────────────────────┘
                      ↓
           GET /api/auth/profile
           Headers: Authorization: Bearer eyJhbGci...
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: middleware/auth.js → authenticate()             │
└──────────────────────────────────────────────────────────┘
  ❶ Lấy token từ header:
     const token = req.headers.authorization?.split(' ')[1]
  
  ❷ Verify token:
     const decoded = jwt.verify(token, JWT_SECRET)
     → { userId, email, iat, exp }
  
  ❸ Kiểm tra hết hạn:
     if (Date.now() >= decoded.exp * 1000) {
       return 401 "Token hết hạn"
     }
  
  ❹ Gắn thông tin user vào request:
     req.user = { userId: decoded.userId, email: decoded.email }
  
  ❺ Cho phép tiếp tục:
     next()
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: authController.js → getProfile()                │
└──────────────────────────────────────────────────────────┘
  ❻ Lấy userId từ req.user.userId
  ❼ Query database lấy thông tin user
  ❽ Response: { user: { id, email, full_name, role, ... } }
```

### **4️⃣ Auto Refresh Token (Khi Access Token hết hạn)**

```
┌──────────────────────────────────────────────────────────┐
│ Tình huống: User đã đăng nhập 16 phút trước              │
│ Access Token (15m) đã HẾT HẠN                            │
│ User click "Đấu giá ngay"                                │
└──────────────────────────────────────────────────────────┘
                      ↓
           POST /api/bids
           Headers: Authorization: Bearer eyJ... (TOKEN CŨ)
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: middleware/auth.js                              │
└──────────────────────────────────────────────────────────┘
  ❶ jwt.verify(token) → TokenExpiredError
  ❷ Response: 401 Unauthorized
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: api.js → Axios Response Interceptor            │
└──────────────────────────────────────────────────────────┘
  ❸ Bắt lỗi 401
  ❹ console.log('🔄 Access token hết hạn, đang refresh...')
  ❺ Gọi API:
     POST /api/auth/refresh
     (Cookie refreshToken tự động gửi kèm)
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: authController.js → refresh()                   │
└──────────────────────────────────────────────────────────┘
  ❻ Lấy refresh token từ cookie:
     const { refreshToken } = req.cookies
  
  ❼ Verify refresh token:
     jwt.verify(refreshToken, JWT_REFRESH_SECRET)
     → { userId }
  
  ❽ Tạo access token MỚI:
     newAccessToken = jwt.sign(
       { userId, email },
       JWT_SECRET,
       { expiresIn: '15m' }
     )
  
  ❾ Response: { success: true, accessToken: "eyJ..." }
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: Axios Interceptor (tiếp)                       │
└──────────────────────────────────────────────────────────┘
  ❿ Lưu access token mới:
     setAccessToken(data.accessToken)
  
  ⓫ RETRY request ban đầu:
     POST /api/bids
     Headers: Authorization: Bearer eyJ... (TOKEN MỚI)
  
  ⓬ Response thành công ✅
  
  ⚠️ USER KHÔNG HỀ BIẾT token đã hết hạn!
```

### **5️⃣ Refresh Page (F5)**

```
┌──────────────────────────────────────────────────────────┐
│ User nhấn F5 → Browser reload toàn bộ JavaScript         │
└──────────────────────────────────────────────────────────┘
  Biến `let accessToken = null` bị RESET
  ↓ Cookie vẫn còn (refreshToken không mất)
                      ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: App.jsx → useEffect(() => checkAuth())         │
└──────────────────────────────────────────────────────────┘
  ❶ getAccessToken() → null (biến đã mất)
  ❷ Gọi authAPI.refreshToken()
  ❸ Backend verify refresh token từ cookie
  ❹ Tạo access token mới
  ❺ setAccessToken(newToken)
  ❻ Gọi authAPI.getProfile()
  ❼ setUser(userData)
  ❽ Render BidderDashboard ✅
```

---

## 📡 API Endpoints

### **Authentication**

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | ❌ Public |
| POST | `/api/auth/login` | Đăng nhập | ❌ Public |
| POST | `/api/auth/refresh` | Refresh access token | 🍪 Cookie |
| POST | `/api/auth/logout` | Đăng xuất | ✅ Required |
| GET | `/api/auth/profile` | Lấy thông tin user | ✅ Required |
| POST | `/api/auth/resend-verification` | Gửi lại email xác nhận | ❌ Public |

### **Request/Response Examples**

#### **POST /api/auth/register**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "full_name": "Nguyễn Văn A"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
  "requireEmailVerification": true,
  "email": "user@example.com"
}
```

#### **POST /api/auth/login**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc-123-def",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A"
  }
}
```

**Response (Email chưa verify):**
```json
{
  "success": false,
  "message": "Vui lòng xác nhận email trước khi đăng nhập.",
  "requireEmailVerification": true
}
```

#### **GET /api/auth/profile**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc-123-def",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "role": "bidder",
    "rating_positive": 10,
    "rating_negative": 1
  }
}
```

---

## 💾 Database Schema

### **Bảng: `auth.users` (Supabase Auth)**
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255),  -- Hash bcrypt
  email_confirmed_at TIMESTAMP,
  user_metadata JSONB,  -- { full_name, password_hash }
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Bảng: `profiles`**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT DEFAULT 'bidder',  -- 'bidder' | 'seller' | 'admin'
  rating_positive INTEGER DEFAULT 0,
  rating_negative INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 Giải thích các file quan trọng

### **Backend**

#### **`server.js`** - Entry point Backend
```javascript
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'

const app = express()

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',  // ← Frontend URL
  credentials: true  // ← Cho phép gửi cookies
}))
app.use(express.json())
app.use(cookieParser())  // ← Parse cookies

// Routes
app.use('/api/auth', authRoutes)

// Start server
app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000')
})
```

**Giải thích:**
- `cors({ credentials: true })`: Cho phép Frontend gửi cookies (refresh token)
- `cookieParser()`: Parse cookies từ request header
- `/api/auth/*`: Tất cả routes authentication

---

#### **`controllers/authController.js`** - Logic xử lý authentication

**Các hàm chính:**

| Hàm | Mô tả | Input | Output |
|-----|-------|-------|--------|
| `register()` | Đăng ký user mới | email, password, full_name | { success, message } |
| `login()` | Đăng nhập | email, password | { accessToken, user } |
| `refresh()` | Refresh access token | Cookie: refreshToken | { accessToken } |
| `logout()` | Đăng xuất | - | { success, message } |
| `getProfile()` | Lấy thông tin user | Header: Authorization | { user } |
| `resendVerification()` | Gửi lại email verify | email | { success, message } |

**Helper functions:**

```javascript
// Tạo Access Token (15 phút)
function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email },  // Payload
    JWT_SECRET,         // Secret key
    { expiresIn: '15m' }  // Thời hạn
  )
}

// Tạo Refresh Token (7 ngày)
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
}
```

---

#### **`middleware/auth.js`** - Middleware xác thực JWT

```javascript
export const authenticate = async (req, res, next) => {
  try {
    // ❶ Lấy token từ header
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token' })
    }

    // ❷ Verify token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // ❸ Gắn user info vào request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    }
    
    // ❹ Cho phép tiếp tục
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token hết hạn' })
    }
    return res.status(401).json({ message: 'Token không hợp lệ' })
  }
}
```

**Sử dụng:**
```javascript
// routes/auth.js
router.get('/profile', authenticate, getProfile)
//                     ↑ Middleware chạy trước controller
```

---

### **Frontend**

#### **`App.jsx`** - Main component với routing

```javascript
function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()  // ← Chạy khi component mount
  }, [])

  const checkAuth = async () => {
    try {
      let token = getAccessToken()
      
      // Nếu không có token, thử refresh từ cookie
      if (!token) {
        const refreshData = await authAPI.refreshToken()
        token = refreshData.accessToken
      }
      
      // Fetch user profile
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.log('Not authenticated')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user ? <BidderDashboard /> : <GuestHomePage />
        } />
        <Route path="/dashboard" element={
          user ? <BidderDashboard /> : <GuestHomePage />
        } />
      </Routes>
    </Router>
  )
}
```

**Flow:**
1. Component mount → gọi `checkAuth()`
2. Kiểm tra có access token không
3. Nếu không → Gọi refresh token
4. Fetch user profile
5. Render Dashboard nếu có user, Guest Page nếu không

---

#### **`services/api.js`** - Axios client & API functions

**Cấu trúc:**

```javascript
// ❶ Tạo Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true  // ← Gửi cookies
})

// ❷ Access Token trong memory (không lưu localStorage)
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

export const getAccessToken = () => {
  return accessToken
}

// ❸ Request Interceptor - Tự động gắn token vào header
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ❹ Response Interceptor - Auto refresh khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      
      // Gọi refresh token
      const { data } = await axios.post('/auth/refresh', {}, {
        withCredentials: true
      })
      
      // Lưu token mới
      setAccessToken(data.accessToken)
      
      // Retry request ban đầu
      error.config.headers.Authorization = `Bearer ${data.accessToken}`
      return api(error.config)
    }
    return Promise.reject(error)
  }
)

// ❺ Export API functions
export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  // ... các function khác
}
```

**Tại sao lưu Access Token trong memory?**
- ✅ **Bảo mật**: Không bị XSS attack lấy được token
- ❌ **Nhược điểm**: Mất khi refresh page → Giải pháp: Dùng Refresh Token

---

#### **`components/Auth/Login.jsx`** - Form đăng nhập

```javascript
function Login({ onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // ❶ Gọi Backend API
      const data = await authAPI.login(email, password)
      
      if (data.success) {
        // ❷ Lưu access token vào memory
        setAccessToken(data.accessToken)
        
        // ❸ Redirect sang Dashboard
        window.location.href = '/dashboard'
      }
    } catch (err) {
      // ❹ Xử lý lỗi
      const errorData = err.response?.data
      setError(errorData?.message || 'Đăng nhập thất bại')
      
      // Nếu email chưa verify
      if (errorData?.requireEmailVerification) {
        setNeedsVerification(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* Form UI */}
    </form>
  )
}
```

---

#### **`pages/BidderDashboard.jsx`** - Dashboard của Bidder

**Các tab:**
1. **Khám phá đấu giá**: Danh sách sản phẩm đang đấu giá
2. **Đấu giá của tôi**: Lịch sử đấu giá
3. **Theo dõi**: Sản phẩm yêu thích
4. **Hồ sơ**: Thông tin cá nhân

```javascript
function BidderDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    const userData = await authAPI.getProfile()
    setUser(userData)
  }

  return (
    <div>
      {/* Navbar với search, avatar, logout */}
      <nav>...</nav>
      
      {/* Tabs */}
      <div>
        {activeTab === 'browse' && <BrowseAuctions />}
        {activeTab === 'my-bids' && <MyBids />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'profile' && <Profile user={user} />}
      </div>
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### **❌ Lỗi: "CORS policy blocked"**

**Nguyên nhân:** Backend không cho phép Frontend gọi API

**Giải pháp:**
```javascript
// Backend/server.js
app.use(cors({
  origin: 'http://localhost:5173',  // ← Kiểm tra URL đúng không
  credentials: true
}))
```

Hoặc kiểm tra `.env`:
```
FRONTEND_URL=http://localhost:5173  # ← Phải khớp với Frontend
```

---

### **❌ Lỗi: "Token hết hạn" mặc dù vừa đăng nhập**

**Nguyên nhân:** Access Token chỉ có 15 phút

**Giải pháp:**
- ✅ Đã có auto-refresh trong `api.js` interceptor
- ✅ Kiểm tra Console có log "🔄 Access token hết hạn, đang refresh..."
- ❌ Nếu không thấy log → Interceptor chưa hoạt động

**Test:**
```javascript
// Trong Console tab
console.log('Interceptor:', api.interceptors.response)
```

---

### **❌ Lỗi: "Refresh token không hợp lệ"**

**Nguyên nhân:** Cookie bị xóa hoặc hết hạn (7 ngày)

**Giải pháp:**
1. Kiểm tra cookie trong DevTools → Application → Cookies
2. Phải có cookie `refreshToken`
3. Nếu không có → Đăng nhập lại

---

### **❌ Lỗi: "Cannot read properties of null (reading 'full_name')"**

**Nguyên nhân:** User chưa được fetch hoặc API lỗi

**Giải pháp:**
```javascript
// Dùng optional chaining
<div>{user?.full_name}</div>

// Hoặc kiểm tra trước
{user && <div>{user.full_name}</div>}
```

---

### **❌ Backend không chạy: "Error: listen EADDRINUSE: address already in use :::5000"**

**Nguyên nhân:** Port 5000 đang bị chiếm

**Giải pháp:**

```powershell
# Windows PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Kiểm tra port
netstat -ano | findstr :5000

# Nếu vẫn bị chiếm, đổi port khác
# Backend/.env
PORT=5001
```

---

### **❌ Frontend không load style (Tailwind CSS)**

**Nguyên nhân:** Chưa chạy Vite dev server

**Giải pháp:**
```bash
cd Frontend
npm run dev
```

Kiểm tra `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // ← Phải có dòng này
  ],
  // ...
}
```

---

## 📚 Tài liệu tham khảo

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Express.js Documentation](https://expressjs.com)
- [JWT Introduction](https://jwt.io/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [Axios Documentation](https://axios-http.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 👥 Team & Contribution

**Quy tắc commit:**
```
feat: Thêm tính năng mới
fix: Sửa bug
docs: Cập nhật documentation
style: Format code
refactor: Refactor code
test: Thêm test
```

**Branch naming:**
```
feature/ten-tinh-nang
bugfix/ten-bug
hotfix/ten-hotfix
```

---

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập

---

**🎉 Chúc team code vui vẻ!**