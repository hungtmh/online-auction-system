# 🎯 Auction MVP Demo - Hệ thống Đấu Giá Trực Tuyến

> **MVP (Minimum Viable Product)** - Phiên bản demo đơn giản để team dev hiểu flow và kiến trúc hệ thống đấu giá trực tuyến.

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Tech Stack](#tech-stack)
- [Cài đặt](#cài-đặt)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Tài khoản demo](#tài-khoản-demo)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Database Schema](#database-schema)

---

## 🎓 Giới thiệu

Đây là phiên bản **MVP** (Minimum Viable Product) của hệ thống đấu giá trực tuyến. Mục đích:

✅ **Demo đầy đủ flow** của hệ thống đấu giá  
✅ **Code đơn giản, dễ hiểu** để team dev nắm bắt nhanh  
✅ **Có thể chạy ngay** mà không cần setup phức tạp  
✅ **Sử dụng SQLite** - không cần cài đặt database server

---

## ⭐ Tính năng chính

### 1️⃣ Guest (Người dùng ẩn danh)
- ✅ Xem trang chủ với top 5 sản phẩm (gần kết thúc, nhiều lượt đấu giá, giá cao)
- ✅ Xem danh sách sản phẩm theo danh mục
- ✅ Tìm kiếm & lọc sản phẩm
- ✅ Xem chi tiết sản phẩm
- ✅ Xem lịch sử đấu giá (tên người đấu giá được che)
- ✅ Đăng ký / Đăng nhập

### 2️⃣ Bidder (Người mua)
- ✅ Ra giá cho sản phẩm
- ✅ Xem danh sách sản phẩm đang tham gia đấu giá
- ✅ Xem danh sách sản phẩm đã thắng
- ✅ Xem điểm đánh giá cá nhân

### 3️⃣ Seller (Người bán)
- ⏳ *Chưa implement trong MVP này*

### 4️⃣ Admin
- ⏳ *Chưa implement trong MVP này*

---

## 🛠️ Tech Stack

| Công nghệ | Mục đích |
|-----------|----------|
| **Node.js** + **Express.js** | Backend Server |
| **EJS** | Template Engine (View) |
| **SQLite** | Database (file-based, không cần server) |
| **better-sqlite3** | SQLite driver |
| **Bcrypt** | Mã hóa mật khẩu |
| **Bootstrap 5** | UI Framework |
| **Moment.js** | Xử lý thời gian |

---

## 📦 Cài đặt

### Yêu cầu hệ thống
- **Node.js** >= 16.x
- **npm** hoặc **yarn**

### Bước 1: Clone/Download project

```bash
cd MVP-demo
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Setup database & seed data

```bash
npm run setup
```

**Output mong đợi:**
```
🔧 Setting up database...
✅ Tables created
✅ Created 6 users (password: 123456)
✅ Created 10 categories
📦 Creating 22 products with realistic data...
✅ Created 22 products
✅ Created bid history for products

╔═══════════════════════════════════════════════════╗
║   ✅ DATABASE SETUP COMPLETED!                    ║
╠═══════════════════════════════════════════════════╣
║   📊 Summary:                                     ║
║   - 6 users (admin, sellers, bidders)            ║
║   - 10 categories (2-level hierarchy)            ║
║   - 22 products with images & full info          ║
║   - Bid history for all products                 ║
╚═══════════════════════════════════════════════════╝
```

---

## 🚀 Chạy ứng dụng

### Development mode (auto-restart)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

**Truy cập:** http://localhost:3000

```
╔═══════════════════════════════════════════════════╗
║   🎯 AUCTION MVP DEMO RUNNING                     ║
║   📍 http://localhost:3000                        ║
║   🚀 Nhấn Ctrl+C để tắt server                    ║
╚═══════════════════════════════════════════════════╝
```

---

## 👤 Tài khoản demo

| Email | Mật khẩu | Role | Đánh giá |
|-------|----------|------|----------|
| `admin@auction.com` | `123456` | **Admin** | - |
| `seller1@gmail.com` | `123456` | **Seller** | 45+ / 5- (90%) |
| `seller2@gmail.com` | `123456` | **Seller** | 30+ / 2- (94%) |
| `bidder1@gmail.com` | `123456` | **Bidder** | 20+ / 3- (87%) |
| `bidder2@gmail.com` | `123456` | **Bidder** | 15+ / 1- (94%) |
| `bidder3@gmail.com` | `123456` | **Bidder** | 8+ / 2- (80%) |

---

## 📁 Cấu trúc thư mục

```
MVP-demo/
├── routes/                 # Routes (Controllers)
│   ├── index.js           # Trang chủ, search
│   ├── auth.js            # Đăng nhập, đăng ký
│   ├── products.js        # Danh sách, chi tiết sản phẩm
│   ├── bids.js            # Đấu giá
│   └── profile.js         # Hồ sơ cá nhân
├── views/                  # EJS Templates
│   ├── partials/          # Navbar, Footer
│   ├── auth/              # Login, Register
│   ├── products/          # Product list, detail
│   ├── profile/           # User profile
│   ├── index.ejs          # Homepage
│   ├── search.ejs         # Search page
│   └── error.ejs          # Error page
├── database.js            # Database connection
├── setup-database.js      # Database setup & seed
├── server.js              # Main server
├── package.json           # Dependencies
└── README.md              # Documentation
```

---

## 🗄️ Database Schema

### **users**
```sql
- id (PK)
- email (UNIQUE)
- password (bcrypt hashed)
- full_name
- role (bidder/seller/admin)
- rating_positive
- rating_negative
- created_at
```

### **categories**
```sql
- id (PK)
- name
- parent_id (FK to categories)
```

### **products**
```sql
- id (PK)
- title
- description
- image_url
- starting_price
- current_price
- buy_now_price
- price_step
- category_id (FK)
- seller_id (FK to users)
- end_time
- status (active/ended)
- bid_count
- created_at
```

### **bids**
```sql
- id (PK)
- product_id (FK to products)
- bidder_id (FK to users)
- bid_amount
- created_at
```

---

## 🎯 Flow chính trong MVP

### 1. Đăng ký & Đăng nhập
```
Guest → /auth/register → Nhập thông tin → Bcrypt hash password → Tạo user
Guest → /auth/login → Verify password → Tạo session → Redirect homepage
```

### 2. Xem sản phẩm
```
Homepage → Top 5 products (3 categories)
Category → Product list (pagination)
Search → Filter + Sort (full-text search)
Product detail → Full info + Bid history + Related products
```

### 3. Đấu giá
```
Product detail → Login required → Enter bid amount
Validate: 
  - Bid >= current_price + price_step
  - User != seller
  - Auction not ended
→ Insert bid → Update product current_price → Success
```

### 4. Profile
```
Profile → View:
  - User info & rating
  - Products I'm bidding (với status: leading/outbid)
  - Products I won
```

---

## 📚 API Routes

| Method | Route | Mô tả |
|--------|-------|-------|
| `GET` | `/` | Trang chủ |
| `GET` | `/search` | Tìm kiếm sản phẩm |
| `GET` | `/products/category/:id` | Sản phẩm theo danh mục |
| `GET` | `/products/:id` | Chi tiết sản phẩm |
| `POST` | `/bids` | Đặt giá (require login) |
| `GET` | `/profile` | Hồ sơ cá nhân (require login) |
| `GET` | `/auth/login` | Trang đăng nhập |
| `POST` | `/auth/login` | Xử lý đăng nhập |
| `GET` | `/auth/register` | Trang đăng ký |
| `POST` | `/auth/register` | Xử lý đăng ký |
| `GET` | `/auth/logout` | Đăng xuất |

---

## 🔧 Lưu ý khi phát triển

### ✅ MVP này đã có:
- Authentication (Session-based)
- Password hashing (Bcrypt)
- Product listing & filtering
- Bidding system
- User ratings
- Responsive UI (Bootstrap)

### ⚠️ MVP này CHƯA có (để team dev implement):
- ❌ Seller posting products
- ❌ Admin panel
- ❌ Watch list (yêu thích)
- ❌ Q&A system (hỏi đáp)
- ❌ Email notifications
- ❌ Auto-extend auction
- ❌ Automatic bidding
- ❌ Payment flow
- ❌ Image upload
- ❌ Real-time updates
- ❌ reCaptcha

---

## 💡 Tips cho team dev

### 1. Hiểu flow trước khi code
- Chạy demo này và **test tất cả tính năng**
- Đọc code trong `/routes` để hiểu logic
- Xem database schema để hiểu data model

### 2. Mở rộng từ MVP
- Thêm routes mới cho seller/admin
- Thêm middleware authorization (role-based)
- Tích hợp email service (nodemailer)
- Implement file upload (multer)
- Migrate từ SQLite sang MySQL/PostgreSQL

### 3. Best practices
- ✅ Luôn validate input
- ✅ Handle errors properly
- ✅ Use transactions cho operations quan trọng
- ✅ Hash passwords (đã có sẵn)
- ✅ Sanitize user input
- ✅ Git commit thường xuyên

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module 'better-sqlite3'"
```bash
npm install
```

### Lỗi: "EADDRINUSE: address already in use :::3000"
Port 3000 đang được sử dụng. Đổi port trong `server.js`:
```javascript
const PORT = 3001; // Thay 3000 thành port khác
```

### Reset database
```bash
# Xóa database cũ
rm database.db

# Tạo lại
npm run setup
```

---

## 📞 Hỗ trợ

Nếu có vấn đề, check:
1. Node.js version >= 16.x
2. `npm install` đã chạy thành công
3. `npm run setup` đã tạo database
4. Port 3000 không bị trùng

---

## 📝 License

MIT License - Dùng tự do cho mục đích học tập

---

## 🎓 Dành cho PTUDW Final Project

**MVP này là bản demo đơn giản!** Team cần:

1. ✅ **Hiểu flow** từ demo này
2. 📝 **Thiết kế database** đầy đủ hơn
3. 🎨 **Design UI/UX** đẹp hơn
4. 🔧 **Implement đầy đủ** các tính năng theo yêu cầu
5. 🚀 **Deploy** lên server thật
6. 📊 **Seed data** đầy đủ (20+ products, bid history...)
7. 💾 **Git commit** thường xuyên (quan trọng!)

**Good luck! 🚀**
