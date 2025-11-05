# 👥 PHÂN CÔNG CÔNG VIỆC NHÓM - AUCTION SYSTEM

## 🎯 **TỔNG QUAN DỰ ÁN**

Dự án: **Online Auction System** (Hệ thống đấu giá trực tuyến)
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + Google OAuth

---

## 📂 **CẤU TRÚC THƯ MỤC THEO TỪNG NGƯỜI**

```
auction-system/
├── Backend/
│   ├── controllers/
│   │   ├── authController.js         # CHUNG - Đã hoàn thành
│   │   ├── guestController.js        # 👤 KHẢI
│   │   ├── bidderController.js       # 👤 KHOA
│   │   ├── sellerController.js       # 👤 CƯỜNG
│   │   └── adminController.js        # 👤 THẮNG
│   │
│   ├── routes/
│   │   ├── auth.js                   # CHUNG - Đã hoàn thành
│   │   ├── guest.js                  # 👤 KHẢI
│   │   ├── bidder.js                 # 👤 KHOA
│   │   ├── seller.js                 # 👤 CƯỜNG
│   │   └── admin.js                  # 👤 THẮNG
│   │
│   ├── middleware/
│   │   └── auth.js                   # CHUNG - Đã hoàn thành
│   │
│   └── server.js                     # CHUNG - Tích hợp routes
│
└── Frontend/
    └── src/
        ├── pages/
        │   ├── GuestHomePage.jsx     # 👤 KHẢI
        │   ├── BidderDashboard.jsx   # 👤 KHOA
        │   ├── SellerDashboard.jsx   # 👤 CƯỜNG
        │   ├── AdminDashboard.jsx    # 👤 THẮNG
        │   ├── LoginPage.jsx         # CHUNG - Đã hoàn thành
        │   ├── RegisterPage.jsx      # CHUNG - Đã hoàn thành
        │   └── AuthCallback.jsx      # CHUNG - Đã hoàn thành
        │
        ├── components/
        │   ├── GuestHomePage/
        │   │   └── GuestHomePageContent.jsx  # 👤 KHẢI
        │   │
        │   ├── Bidder/               # 👤 KHOA
        │   │   ├── ProductList.jsx
        │   │   ├── BidForm.jsx
        │   │   ├── MyBids.jsx
        │   │   └── Watchlist.jsx
        │   │
        │   ├── Seller/               # 👤 CƯỜNG
        │   │   ├── ProductForm.jsx
        │   │   ├── MyProducts.jsx
        │   │   └── SalesStats.jsx
        │   │
        │   └── Admin/                # 👤 THẮNG
        │       ├── UserManagement.jsx
        │       ├── ProductManagement.jsx
        │       └── SystemSettings.jsx
        │
        └── services/
            ├── api.js                # CHUNG - Base API
            ├── guestAPI.js           # 👤 KHẢI
            ├── bidderAPI.js          # 👤 KHOA
            ├── sellerAPI.js          # 👤 CƯỜNG
            └── adminAPI.js           # 👤 THẮNG
```

---

## 🔥 **CHI TIẾT PHÂN CÔNG**

### 👤 **KHẢI - GUEST HOMEPAGE (Trang chủ khách)**

#### **Mô tả nhiệm vụ:**
Trang chủ dành cho khách chưa đăng nhập, xem sản phẩm, tìm kiếm, danh mục.

#### **Files cần làm:**

**Frontend:**
```
✅ src/pages/GuestHomePage.jsx              # Đã hoàn thành
✅ src/components/GuestHomePage/
   └── GuestHomePageContent.jsx             # Đã hoàn thành
   
📝 TODO: Tạo thêm components con
   ├── ProductCard.jsx                      # Card hiển thị sản phẩm
   ├── CategoryList.jsx                     # Danh sách danh mục
   ├── SearchBar.jsx                        # Thanh tìm kiếm
   └── FeaturedProducts.jsx                 # Sản phẩm nổi bật
   
📝 src/services/guestAPI.js                 # API calls cho guest
```

**Backend:**
```
📝 controllers/guestController.js
   - getProducts()              # Lấy danh sách sản phẩm (public)
   - getProductById()           # Xem chi tiết sản phẩm
   - searchProducts()           # Tìm kiếm sản phẩm
   - getCategories()            # Lấy danh mục
   - getFeaturedProducts()      # Sản phẩm nổi bật

📝 routes/guest.js
   - GET /api/guest/products
   - GET /api/guest/products/:id
   - GET /api/guest/search?q=...
   - GET /api/guest/categories
   - GET /api/guest/featured
```

**Database Tables:**
- `products` (đọc)
- `categories` (đọc)
- `product_descriptions` (đọc)

---

### 👤 **KHOA - BIDDER DASHBOARD (Người đấu giá)**

#### **Mô tả nhiệm vụ:**
Dashboard cho người mua, xem sản phẩm, đấu giá, theo dõi watchlist, lịch sử đấu giá.

#### **Files cần làm:**

**Frontend:**
```
✅ src/pages/BidderDashboard.jsx            # Đã có template
   
📝 TODO: Tạo components
   ├── ProductList.jsx                      # Danh sách sản phẩm đấu giá
   ├── BidForm.jsx                          # Form đặt giá
   ├── MyBids.jsx                           # Lịch sử đấu giá của tôi
   ├── Watchlist.jsx                        # Danh sách theo dõi
   ├── BidHistory.jsx                       # Lịch sử giá đấu
   └── ProductDetail.jsx                    # Chi tiết sản phẩm
   
📝 src/services/bidderAPI.js
```

**Backend:**
```
📝 controllers/bidderController.js
   - getAuctionProducts()       # Lấy sản phẩm đang đấu giá
   - placeBid()                 # Đặt giá đấu
   - getMyBids()                # Lịch sử đấu giá của tôi
   - addToWatchlist()           # Thêm vào watchlist
   - removeFromWatchlist()      # Xóa khỏi watchlist
   - getWatchlist()             # Lấy danh sách watchlist
   - getBidHistory()            # Lịch sử giá đấu của sản phẩm

📝 routes/bidder.js
   - GET    /api/bidder/products               # Sản phẩm đấu giá
   - POST   /api/bidder/bids                   # Đặt giá
   - GET    /api/bidder/bids/my                # Lịch sử đấu giá
   - POST   /api/bidder/watchlist              # Thêm watchlist
   - DELETE /api/bidder/watchlist/:productId   # Xóa watchlist
   - GET    /api/bidder/watchlist              # Lấy watchlist
   - GET    /api/bidder/products/:id/bids      # Lịch sử giá đấu
```

**Database Tables:**
- `products` (đọc)
- `bids` (tạo, đọc)
- `watchlist` (tạo, đọc, xóa)
- `rejected_bidders` (kiểm tra)

---

### 👤 **CƯỜNG - SELLER DASHBOARD (Người bán)**

#### **Mô tả nhiệm vụ:**
Dashboard cho người bán, đăng sản phẩm, quản lý sản phẩm, xem thống kê.

#### **Files cần làm:**

**Frontend:**
```
✅ src/pages/SellerDashboard.jsx            # Đã có template
   
📝 TODO: Tạo components
   ├── ProductForm.jsx                      # Form đăng/sửa sản phẩm
   ├── MyProducts.jsx                       # Danh sách sản phẩm của tôi
   ├── ProductEditor.jsx                    # Sửa sản phẩm
   ├── SalesStats.jsx                       # Thống kê doanh thu
   ├── BidsList.jsx                         # Danh sách giá đấu
   └── ImageUpload.jsx                      # Upload ảnh sản phẩm
   
📝 src/services/sellerAPI.js
```

**Backend:**
```
📝 controllers/sellerController.js
   - createProduct()            # Đăng sản phẩm mới
   - getMyProducts()            # Sản phẩm của tôi
   - updateProduct()            # Cập nhật sản phẩm
   - deleteProduct()            # Xóa sản phẩm
   - getProductBids()           # Xem giá đấu của sản phẩm
   - getSalesStats()            # Thống kê doanh thu
   - uploadProductImages()      # Upload ảnh

📝 routes/seller.js
   - POST   /api/seller/products              # Tạo sản phẩm
   - GET    /api/seller/products              # Sản phẩm của tôi
   - PUT    /api/seller/products/:id          # Sửa sản phẩm
   - DELETE /api/seller/products/:id          # Xóa sản phẩm
   - GET    /api/seller/products/:id/bids     # Xem giá đấu
   - GET    /api/seller/stats                 # Thống kê
   - POST   /api/seller/upload                # Upload ảnh
```

**Database Tables:**
- `products` (tạo, đọc, sửa, xóa)
- `product_descriptions` (tạo, sửa)
- `bids` (đọc)
- `categories` (đọc)

---

### 👤 **THẮNG - ADMIN DASHBOARD (Quản trị viên)**

#### **Mô tả nhiệm vụ:**
Dashboard quản trị, quản lý users, duyệt sản phẩm, xử lý tranh chấp, cấu hình hệ thống.

#### **Files cần làm:**

**Frontend:**
```
✅ src/pages/AdminDashboard.jsx             # Đã có template
   
📝 TODO: Tạo components
   ├── UserManagement.jsx                   # Quản lý users
   ├── ProductManagement.jsx                # Duyệt/xóa sản phẩm
   ├── BidManagement.jsx                    # Xem lịch sử đấu giá
   ├── SystemSettings.jsx                   # Cấu hình hệ thống
   ├── UpgradeRequests.jsx                  # Duyệt yêu cầu nâng cấp
   ├── UserDetail.jsx                       # Chi tiết user
   └── ProductApproval.jsx                  # Duyệt sản phẩm
   
📝 src/services/adminAPI.js
```

**Backend:**
```
📝 controllers/adminController.js
   - getAllUsers()              # Lấy tất cả users
   - getUserById()              # Chi tiết user
   - updateUserRole()           # Thay đổi role
   - banUser()                  # Cấm user
   - deleteUser()               # Xóa user
   - getAllProducts()           # Tất cả sản phẩm
   - approveProduct()           # Duyệt sản phẩm
   - rejectProduct()            # Từ chối sản phẩm
   - deleteProduct()            # Xóa sản phẩm vi phạm
   - getUpgradeRequests()       # Yêu cầu nâng cấp
   - approveUpgrade()           # Duyệt nâng cấp
   - rejectUpgrade()            # Từ chối nâng cấp
   - getSystemStats()           # Thống kê hệ thống

📝 routes/admin.js
   - GET    /api/admin/users                  # Danh sách users
   - GET    /api/admin/users/:id              # Chi tiết user
   - PUT    /api/admin/users/:id/role         # Thay đổi role
   - POST   /api/admin/users/:id/ban          # Cấm user
   - DELETE /api/admin/users/:id              # Xóa user
   - GET    /api/admin/products               # Tất cả sản phẩm
   - POST   /api/admin/products/:id/approve   # Duyệt sản phẩm
   - POST   /api/admin/products/:id/reject    # Từ chối
   - DELETE /api/admin/products/:id           # Xóa sản phẩm
   - GET    /api/admin/upgrades               # Yêu cầu nâng cấp
   - POST   /api/admin/upgrades/:id/approve   # Duyệt nâng cấp
   - POST   /api/admin/upgrades/:id/reject    # Từ chối nâng cấp
   - GET    /api/admin/stats                  # Thống kê
```

**Database Tables:**
- `profiles` (đọc, sửa, xóa)
- `products` (đọc, xóa)
- `upgrade_requests` (đọc, sửa)
- `bids` (đọc)
- `system_settings` (đọc, sửa)

---

## 🔄 **WORKFLOW - QUY TRÌNH LÀM VIỆC**

### **Bước 1: Mỗi người tạo branch riêng**

```bash
# Khải
git checkout -b feature/guest-homepage

# Khoa
git checkout -b feature/bidder-dashboard

# Cường
git checkout -b feature/seller-dashboard

# Thắng
git checkout -b feature/admin-dashboard
```

### **Bước 2: Tạo files theo cấu trúc**

**Backend:**
1. Tạo `controllers/{role}Controller.js`
2. Tạo `routes/{role}.js`
3. Thêm route vào `server.js`

**Frontend:**
1. Tạo components trong `src/components/{Role}/`
2. Tạo API service trong `src/services/{role}API.js`
3. Cập nhật Dashboard page

### **Bước 3: Test riêng**

- Mỗi người test chức năng của mình
- Dùng Postman/Thunder Client test Backend API
- Test Frontend trên trình duyệt

### **Bước 4: Merge vào main**

```bash
# Commit changes
git add .
git commit -m "feat: add {role} features"

# Push lên GitHub
git push origin feature/{role}-dashboard

# Tạo Pull Request trên GitHub
# Review code rồi merge vào main
```

---

## 📚 **TÀI LIỆU THAM KHẢO**

### **Database Schema:**
- File: `Backend/DATABASE-SCHEMA.sql`
- Diagram: `Backend/DATABASE-DIAGRAM.md`

### **API Documentation:**
- Authentication: `Backend/README.md`
- Supabase Setup: `Frontend/SUPABASE-SETUP.md`

### **Existing Code:**
- Login/Register: `Frontend/src/pages/LoginPage.jsx`, `RegisterPage.jsx`
- Auth API: `Frontend/src/services/api.js`
- Auth Controller: `Backend/controllers/authController.js`

---

## ⚠️ **LƯU Ý QUAN TRỌNG**

### **1. API Base URL:**
```javascript
// Frontend - Dùng biến môi trường
const API_URL = import.meta.env.VITE_API_URL  // http://localhost:5000
```

### **2. Authentication:**
```javascript
// Frontend - Gọi API với token
import { authAPI } from '../services/api'

// Backend - Kiểm tra auth
import { authenticateToken, requireRole } from '../middleware/auth'

router.get('/products', authenticateToken, requireRole('seller'), getMyProducts)
```

### **3. Database Queries:**
```javascript
// Backend - Dùng Supabase client
import { supabase } from '../config/supabase'

const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('seller_id', userId)
```

### **4. Error Handling:**
```javascript
// Backend
try {
  // Code
} catch (error) {
  console.error('Error:', error)
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  })
}

// Frontend
try {
  const data = await bidderAPI.placeBid(productId, amount)
} catch (error) {
  alert(error.response?.data?.message || 'Có lỗi xảy ra')
}
```

---

## 📞 **HỖ TRỢ & LIÊN HỆ**

- **Gặp lỗi Database?** → Xem `DATABASE-SCHEMA.sql`
- **Gặp lỗi Auth?** → Xem `authController.js`, `middleware/auth.js`
- **Không gọi được API?** → Check `.env` file, Backend có chạy không?
- **Lỗi CORS?** → Check `server.js` đã config CORS chưa

---

## ✅ **CHECKLIST HOÀN THÀNH**

### **Khải (Guest):**
- [ ] Backend: `guestController.js`, `routes/guest.js`
- [ ] Frontend: Components (ProductCard, SearchBar, CategoryList)
- [ ] Frontend: `services/guestAPI.js`
- [ ] Test: Xem được sản phẩm, tìm kiếm, danh mục

### **Khoa (Bidder):**
- [ ] Backend: `bidderController.js`, `routes/bidder.js`
- [ ] Frontend: Components (ProductList, BidForm, MyBids, Watchlist)
- [ ] Frontend: `services/bidderAPI.js`
- [ ] Test: Đặt giá, xem lịch sử, watchlist

### **Cường (Seller):**
- [ ] Backend: `sellerController.js`, `routes/seller.js`
- [ ] Frontend: Components (ProductForm, MyProducts, SalesStats)
- [ ] Frontend: `services/sellerAPI.js`
- [ ] Test: Đăng sản phẩm, sửa, xóa, thống kê

### **Thắng (Admin):**
- [ ] Backend: `adminController.js`, `routes/admin.js`
- [ ] Frontend: Components (UserManagement, ProductManagement, SystemSettings)
- [ ] Frontend: `services/adminAPI.js`
- [ ] Test: Quản lý users, duyệt sản phẩm, thống kê

---

**📅 Deadline:** Theo lịch học PTUDW
**🎯 Mục tiêu:** Mỗi người hoàn thành 100% phần của mình, hệ thống chạy được đầy đủ chức năng.

---

**Good luck! 🚀**
