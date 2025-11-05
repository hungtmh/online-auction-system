# 👤 PHẦN CÔNG VIỆC CỦA THẮNG - ADMIN DASHBOARD

## 🎯 Nhiệm vụ

Dashboard quản trị, quản lý users, duyệt sản phẩm, xử lý tranh chấp, cấu hình hệ thống.

---

## 📂 Files của bạn

### **Backend:**
```
✅ controllers/adminController.js   # Đã tạo sẵn
✅ routes/admin.js                  # Đã tạo sẵn
```

### **Frontend:**
```
✅ pages/AdminDashboard.jsx         # Đã có template
✅ services/adminAPI.js             # Đã tạo sẵn

📝 TODO: Tạo components
   └── components/Admin/
       ├── UserManagement.jsx       # Quản lý users
       ├── ProductManagement.jsx    # Duyệt/xóa sản phẩm
       ├── BidManagement.jsx        # Xem lịch sử đấu giá
       ├── SystemSettings.jsx       # Cấu hình hệ thống
       ├── UpgradeRequests.jsx      # Duyệt yêu cầu nâng cấp
       ├── UserDetail.jsx           # Chi tiết user
       └── ProductApproval.jsx      # Duyệt sản phẩm
```

---

## 🔧 Backend APIs đã có

## **A. USER MANAGEMENT**

### 1. **GET /api/admin/users**
Lấy danh sách users

**Query params:**
- `role`: Lọc theo role (`bidder`, `seller`, `admin`)
- `page`, `limit`: Phân trang

### 2. **GET /api/admin/users/:id**
Chi tiết user (bao gồm số sản phẩm, số bids)

### 3. **PUT /api/admin/users/:id/role**
Thay đổi role

**Body:**
```json
{
  "role": "guest|bidder|seller|admin"
}
```

**Lưu ý:** Không được thay đổi role của chính mình

### 4. **POST /api/admin/users/:id/ban**
Cấm user (set role về `guest`)

### 5. **DELETE /api/admin/users/:id**
Xóa user hoàn toàn

---

## **B. PRODUCT MANAGEMENT**

### 6. **GET /api/admin/products**
Lấy tất cả sản phẩm

**Query params:**
- `status`: `pending` | `active` | `sold` | `rejected`

### 7. **POST /api/admin/products/:id/approve**
Duyệt sản phẩm (set status = `active`)

### 8. **POST /api/admin/products/:id/reject**
Từ chối sản phẩm

**Body:**
```json
{
  "reason": "Lý do từ chối"
}
```

### 9. **DELETE /api/admin/products/:id**
Xóa sản phẩm vi phạm

---

## **C. UPGRADE REQUESTS**

### 10. **GET /api/admin/upgrades**
Lấy yêu cầu nâng cấp

**Query params:**
- `status`: `pending` | `approved` | `rejected`

### 11. **POST /api/admin/upgrades/:id/approve**
Duyệt yêu cầu nâng cấp (tự động thay đổi role của user)

### 12. **POST /api/admin/upgrades/:id/reject**
Từ chối yêu cầu nâng cấp

---

## **D. SYSTEM STATS**

### 13. **GET /api/admin/stats**
Thống kê hệ thống

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalProducts": 500,
    "activeProducts": 200,
    "totalBids": 1000,
    "pendingUpgrades": 5
  }
}
```

---

## 💻 Frontend - Cách sử dụng API

### Import API service:
```javascript
import adminAPI from '../services/adminAPI'
```

### Ví dụ: Lấy users
```javascript
const fetchUsers = async () => {
  const response = await adminAPI.getAllUsers({ 
    role: 'bidder',
    page: 1,
    limit: 20 
  })
  setUsers(response.data)
}
```

### Ví dụ: Thay đổi role
```javascript
const handleChangeRole = async (userId, newRole) => {
  try {
    await adminAPI.updateUserRole(userId, newRole)
    alert('Đã thay đổi role thành công')
  } catch (error) {
    alert(error.response?.data?.message || 'Lỗi')
  }
}
```

### Ví dụ: Duyệt sản phẩm
```javascript
const handleApproveProduct = async (productId) => {
  await adminAPI.approveProduct(productId)
  alert('Đã duyệt sản phẩm')
}
```

### Ví dụ: Duyệt yêu cầu nâng cấp
```javascript
const handleApproveUpgrade = async (requestId) => {
  await adminAPI.approveUpgrade(requestId)
  alert('Đã duyệt yêu cầu nâng cấp')
}
```

### Ví dụ: Thống kê
```javascript
const fetchStats = async () => {
  const response = await adminAPI.getSystemStats()
  setStats(response.data)
}
```

---

## ✅ Checklist công việc

### **Backend:**
- [x] `adminController.js` - Đã tạo sẵn
- [x] `routes/admin.js` - Đã tạo sẵn
- [ ] Test API bằng Postman với Bearer token (role admin)

### **Frontend:**
- [x] `services/adminAPI.js` - Đã tạo sẵn
- [ ] Tạo `UserManagement.jsx` - Bảng users, filter, actions
- [ ] Tạo `ProductManagement.jsx` - Duyệt/từ chối sản phẩm
- [ ] Tạo `UpgradeRequests.jsx` - Duyệt yêu cầu nâng cấp
- [ ] Tạo `SystemSettings.jsx` - Cấu hình hệ thống
- [ ] Tạo `UserDetail.jsx` - Modal chi tiết user
- [ ] Tạo `ProductApproval.jsx` - Modal duyệt sản phẩm
- [ ] Tích hợp vào `AdminDashboard.jsx`
- [ ] Test quản lý users, duyệt sản phẩm

---

## 🧪 Test APIs (cần đăng nhập admin)

### 1. Login admin để lấy token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'
```

### 2. Test lấy users
```bash
curl -X GET "http://localhost:5000/api/admin/users?role=bidder" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Test thay đổi role
```bash
curl -X PUT http://localhost:5000/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"seller"}'
```

### 4. Test duyệt sản phẩm
```bash
curl -X POST http://localhost:5000/api/admin/products/PRODUCT_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📌 Lưu ý

1. **Cần authentication** - Tất cả APIs yêu cầu `role = admin`
2. **Bảo mật:**
   - Không được thay đổi role của chính mình
   - Không được ban/xóa chính mình
3. **Database tables:**
   - `profiles` (đọc, sửa, xóa)
   - `products` (đọc, xóa)
   - `upgrade_requests` (đọc, sửa)
   - `bids` (đọc)
   - `system_settings` (đọc, sửa)
4. **Workflow duyệt sản phẩm:**
   - Seller tạo sản phẩm → `status = pending`
   - Admin duyệt → `status = active`
   - Admin từ chối → `status = rejected`
5. **Workflow nâng cấp:**
   - User gửi yêu cầu → `upgrade_requests` table
   - Admin duyệt → Tự động thay đổi role trong `profiles` table

---

**Good luck! 🚀**
