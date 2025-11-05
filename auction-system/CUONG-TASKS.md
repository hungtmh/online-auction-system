# 👤 PHẦN CÔNG VIỆC CỦA CƯỜNG - SELLER DASHBOARD

## 🎯 Nhiệm vụ

Dashboard cho người bán, đăng sản phẩm, quản lý sản phẩm, xem thống kê doanh thu.

---

## 📂 Files của bạn

### **Backend:**
```
✅ controllers/sellerController.js  # Đã tạo sẵn
✅ routes/seller.js                 # Đã tạo sẵn
```

### **Frontend:**
```
✅ pages/SellerDashboard.jsx        # Đã có template
✅ services/sellerAPI.js            # Đã tạo sẵn

📝 TODO: Tạo components
   └── components/Seller/
       ├── ProductForm.jsx      # Form đăng/sửa sản phẩm
       ├── MyProducts.jsx       # Danh sách sản phẩm của tôi
       ├── ProductEditor.jsx    # Sửa sản phẩm
       ├── SalesStats.jsx       # Thống kê doanh thu
       ├── BidsList.jsx         # Danh sách giá đấu
       └── ImageUpload.jsx      # Upload ảnh sản phẩm
```

---

## 🔧 Backend APIs đã có

### 1. **POST /api/seller/products**
Đăng sản phẩm mới

**Body:**
```json
{
  "title": "iPhone 15 Pro Max",
  "description": "Mô tả chi tiết...",
  "category_id": "uuid",
  "starting_price": 20000000,
  "step_price": 500000,
  "buy_now_price": 30000000,
  "end_time": "2025-12-31T23:59:59Z",
  "image_url": "https://...",
  "auto_renew": false
}
```

**Response:**
- Sản phẩm được tạo với `status = 'pending'` (chờ admin duyệt)

### 2. **GET /api/seller/products**
Lấy sản phẩm của tôi

**Query params:**
- `status`: `pending` | `active` | `sold` | `rejected`
- `page`, `limit`: Phân trang

### 3. **PUT /api/seller/products/:id**
Cập nhật sản phẩm

**Lưu ý:**
- Chỉ sửa được khi `status = pending` hoặc chưa có bid
- Không sửa được sản phẩm đã có người đấu giá

### 4. **DELETE /api/seller/products/:id**
Xóa sản phẩm

**Lưu ý:**
- Chỉ xóa được khi chưa có bid

### 5. **GET /api/seller/products/:id/bids**
Xem danh sách giá đấu của sản phẩm

### 6. **GET /api/seller/stats**
Thống kê doanh thu

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 10,
    "activeProducts": 5,
    "soldProducts": 3,
    "totalRevenue": 50000000
  }
}
```

---

## 💻 Frontend - Cách sử dụng API

### Import API service:
```javascript
import sellerAPI from '../services/sellerAPI'
```

### Ví dụ: Đăng sản phẩm
```javascript
const handleCreateProduct = async (formData) => {
  try {
    const response = await sellerAPI.createProduct({
      title: formData.title,
      description: formData.description,
      category_id: formData.category,
      starting_price: parseInt(formData.startingPrice),
      step_price: parseInt(formData.stepPrice),
      buy_now_price: parseInt(formData.buyNowPrice),
      end_time: formData.endTime,
      image_url: formData.imageUrl,
      auto_renew: formData.autoRenew
    })
    alert('Đăng sản phẩm thành công, chờ admin duyệt!')
  } catch (error) {
    alert(error.response?.data?.message || 'Lỗi đăng sản phẩm')
  }
}
```

### Ví dụ: Lấy sản phẩm của tôi
```javascript
const fetchMyProducts = async () => {
  const response = await sellerAPI.getMyProducts({ 
    status: 'active',
    page: 1,
    limit: 12 
  })
  setProducts(response.data)
}
```

### Ví dụ: Thống kê
```javascript
const fetchStats = async () => {
  const response = await sellerAPI.getSalesStats()
  setStats(response.data)
}
```

---

## ✅ Checklist công việc

### **Backend:**
- [x] `sellerController.js` - Đã tạo sẵn
- [x] `routes/seller.js` - Đã tạo sẵn
- [ ] Test API bằng Postman với Bearer token

### **Frontend:**
- [x] `services/sellerAPI.js` - Đã tạo sẵn
- [ ] Tạo `ProductForm.jsx` - Form đăng sản phẩm
- [ ] Tạo `MyProducts.jsx` - Danh sách sản phẩm
- [ ] Tạo `ProductEditor.jsx` - Sửa sản phẩm
- [ ] Tạo `SalesStats.jsx` - Thống kê
- [ ] Tạo `BidsList.jsx` - Xem giá đấu
- [ ] Tạo `ImageUpload.jsx` - Upload ảnh
- [ ] Tích hợp vào `SellerDashboard.jsx`
- [ ] Test đăng sản phẩm

---

## 🧪 Test APIs (cần đăng nhập)

### 1. Login để lấy token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"123456"}'
```

### 2. Test đăng sản phẩm
```bash
curl -X POST http://localhost:5000/api/seller/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "category_id": "uuid",
    "starting_price": 100000,
    "step_price": 10000,
    "end_time": "2025-12-31T23:59:59Z"
  }'
```

### 3. Test lấy sản phẩm của tôi
```bash
curl -X GET http://localhost:5000/api/seller/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📌 Lưu ý

1. **Cần authentication** - Tất cả APIs yêu cầu `role = seller`
2. **Trạng thái sản phẩm:**
   - `pending`: Chờ admin duyệt
   - `active`: Đang đấu giá
   - `sold`: Đã bán
   - `rejected`: Admin từ chối
3. **Database tables:**
   - `products` (tạo, đọc, sửa, xóa)
   - `product_descriptions` (tạo, sửa)
   - `bids` (đọc)
   - `categories` (đọc)
4. **Upload ảnh:**
   - Có thể dùng Cloudinary, Imgur, hoặc Supabase Storage
   - Lưu URL vào trường `image_url`

---

**Good luck! 🚀**
