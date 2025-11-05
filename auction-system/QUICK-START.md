# 🚀 HƯỚNG DẪN BẮT ĐẦU - QUICK START GUIDE

## 📋 Phân công nhóm

| Người | Phần phụ trách | File hướng dẫn |
|-------|----------------|----------------|
| **Khải** | Guest Homepage | `KHAI-TASKS.md` |
| **Khoa** | Bidder Dashboard | `KHOA-TASKS.md` |
| **Cường** | Seller Dashboard | `CUONG-TASKS.md` |
| **Thắng** | Admin Dashboard | `THANG-TASKS.md` |

---

## 🎯 Mục tiêu

Mỗi người làm việc độc lập trên **branch riêng**, code **Frontend + Backend** cho phần của mình, sau đó merge vào `main`.

---

## ⚙️ Setup dự án (Lần đầu)

### 1. **Clone repo và cài dependencies**

```bash
# Clone repo
git clone <repo-url>
cd online-auction-system/auction-system

# Cài Backend
cd Backend
npm install

# Cài Frontend
cd ../Frontend
npm install
```

### 2. **Tạo file .env**

**Backend/.env:**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://ojbcqlntvkdpdetmttuu.supabase.co
SUPABASE_SERVICE_KEY=<your-service-key>

# JWT
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**Frontend/.env:**
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://ojbcqlntvkdpdetmttuu.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🌿 Workflow - Làm việc với Git

### **Bước 1: Tạo branch riêng**

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

### **Bước 2: Code phần của mình**

Xem file hướng dẫn riêng:
- Khải → `KHAI-TASKS.md`
- Khoa → `KHOA-TASKS.md`
- Cường → `CUONG-TASKS.md`
- Thắng → `THANG-TASKS.md`

### **Bước 3: Commit và push**

```bash
# Thêm files đã thay đổi
git add .

# Commit với message rõ ràng
git commit -m "feat: add bidder dashboard with bid placement feature"

# Push lên GitHub
git push origin feature/your-branch-name
```

### **Bước 4: Tạo Pull Request**

1. Lên GitHub
2. Click **"Compare & pull request"**
3. Điền mô tả thay đổi
4. Request review từ thành viên khác
5. Sau khi approve → Merge vào `main`

### **Bước 5: Pull code mới nhất**

```bash
# Chuyển về main
git checkout main

# Pull code mới nhất
git pull origin main

# Chuyển lại branch của mình và merge main
git checkout feature/your-branch-name
git merge main
```

---

## 🏃 Chạy dự án

### **Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
# Hoặc: node server.js
```

Server sẽ chạy tại: `http://localhost:5000`

### **Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## 📂 Cấu trúc files đã tạo sẵn

### **Backend:**
```
Backend/
├── controllers/
│   ├── authController.js       ✅ CHUNG (đã xong)
│   ├── guestController.js      ✅ KHẢI (đã tạo sẵn)
│   ├── bidderController.js     ✅ KHOA (đã tạo sẵn)
│   ├── sellerController.js     ✅ CƯỜNG (đã tạo sẵn)
│   └── adminController.js      ✅ THẮNG (đã tạo sẵn)
│
├── routes/
│   ├── auth.js                 ✅ CHUNG (đã xong)
│   ├── guest.js                ✅ KHẢI (đã tạo sẵn)
│   ├── bidder.js               ✅ KHOA (đã tạo sẵn)
│   ├── seller.js               ✅ CƯỜNG (đã tạo sẵn)
│   └── admin.js                ✅ THẮNG (đã tạo sẵn)
│
└── server.js                   ✅ Đã import tất cả routes
```

### **Frontend:**
```
Frontend/src/
├── pages/
│   ├── LoginPage.jsx           ✅ CHUNG (đã xong)
│   ├── RegisterPage.jsx        ✅ CHUNG (đã xong)
│   ├── GuestHomePage.jsx       ⚠️ KHẢI (cần làm tiếp)
│   ├── BidderDashboard.jsx     ⚠️ KHOA (cần làm tiếp)
│   ├── SellerDashboard.jsx     ⚠️ CƯỜNG (cần làm tiếp)
│   └── AdminDashboard.jsx      ⚠️ THẮNG (cần làm tiếp)
│
└── services/
    ├── api.js                  ✅ CHUNG (đã xong)
    ├── guestAPI.js             ✅ KHẢI (đã tạo sẵn)
    ├── bidderAPI.js            ✅ KHOA (đã tạo sẵn)
    ├── sellerAPI.js            ✅ CƯỜNG (đã tạo sẵn)
    └── adminAPI.js             ✅ THẮNG (đã tạo sẵn)
```

---

## 🧪 Test APIs

### **1. Test Backend APIs với Thunder Client / Postman**

**Test Guest API (không cần token):**
```
GET http://localhost:5000/api/guest/products
GET http://localhost:5000/api/guest/categories
```

**Test với authentication:**

1. Login để lấy token:
```
POST http://localhost:5000/api/auth/login
Body: { "email": "test@test.com", "password": "123456" }
```

2. Dùng token để test:
```
GET http://localhost:5000/api/bidder/products
Header: Authorization: Bearer <your-token>
```

### **2. Test Frontend**

Mở trình duyệt: `http://localhost:5173`

- Khách → Xem trang chủ
- Đăng nhập → Tự động redirect theo role
- Test các chức năng của phần mình

---

## 📚 Tài liệu tham khảo

| Tài liệu | Đường dẫn |
|----------|-----------|
| Database Schema | `Backend/DATABASE-SCHEMA.sql` |
| Database Diagram | `Backend/DATABASE-DIAGRAM.md` |
| Team Workflow | `TEAM-WORKFLOW.md` |
| API Auth | `Backend/README.md` |

---

## ⚠️ Lưu ý quan trọng

### **1. Không conflict code:**
- Mỗi người làm file riêng, không sửa file của người khác
- Chỉ sửa file chung (như `server.js`, `App.jsx`) khi cần thiết

### **2. Authentication:**
```javascript
// Frontend - Gọi API với token tự động
import bidderAPI from '../services/bidderAPI'
const data = await bidderAPI.placeBid(productId, amount)

// Backend - Kiểm tra auth
import { authenticateToken, requireRole } from '../middleware/auth'
router.post('/bids', authenticateToken, requireRole('bidder'), placeBid)
```

### **3. Database:**
- Xem schema: `Backend/DATABASE-SCHEMA.sql`
- Dùng Supabase client:
```javascript
import { supabase } from '../config/supabase.js'
const { data, error } = await supabase.from('products').select('*')
```

### **4. Error handling:**
```javascript
// Backend
try {
  // code
} catch (error) {
  res.status(500).json({ success: false, message: 'Error' })
}

// Frontend
try {
  await api.call()
} catch (error) {
  alert(error.response?.data?.message || 'Lỗi')
}
```

---

## 🆘 Gặp vấn đề?

### **Backend không chạy:**
- Check `.env` file có đầy đủ không
- Check port 5000 có bị chiếm không: `netstat -ano | findstr :5000`
- Check Supabase credentials đúng chưa

### **Frontend không gọi được API:**
- Check Backend có chạy không
- Check CORS config trong `server.js`
- Check API URL trong `.env` Frontend

### **Lỗi authentication:**
- Check token có hết hạn không
- Check role có đúng không
- Check middleware `authenticateToken` và `requireRole`

---

## ✅ Checklist hoàn thành

### **Khải (Guest):**
- [ ] Backend APIs hoạt động
- [ ] Frontend components
- [ ] Test xem sản phẩm, tìm kiếm

### **Khoa (Bidder):**
- [ ] Backend APIs hoạt động
- [ ] Frontend components
- [ ] Test đặt giá, watchlist

### **Cường (Seller):**
- [ ] Backend APIs hoạt động
- [ ] Frontend components
- [ ] Test đăng sản phẩm, thống kê

### **Thắng (Admin):**
- [ ] Backend APIs hoạt động
- [ ] Frontend components
- [ ] Test quản lý users, duyệt sản phẩm

---

## 📞 Liên hệ

- **Họp nhóm:** Hàng tuần để sync tiến độ
- **Issues:** Tạo issue trên GitHub nếu gặp bug
- **Pull Requests:** Review code của nhau trước khi merge

---

**Happy Coding! 🚀**
