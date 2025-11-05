# 👤 PHẦN CÔNG VIỆC CỦA KHẢI - GUEST HOMEPAGE

## 🎯 Nhiệm vụ

Trang chủ dành cho khách chưa đăng nhập, xem sản phẩm, tìm kiếm, danh mục.

---

## 📂 Files của bạn

### **Backend:**
```
✅ controllers/guestController.js   # Đã tạo sẵn
✅ routes/guest.js                  # Đã tạo sẵn
```

### **Frontend:**
```
✅ pages/GuestHomePage.jsx                          # Đã có
✅ components/GuestHomePage/GuestHomePageContent.jsx # Đã có
✅ services/guestAPI.js                              # Đã tạo sẵn

📝 TODO: Tạo thêm components
   └── components/GuestHomePage/
       ├── ProductCard.jsx          # Card hiển thị sản phẩm
       ├── CategoryList.jsx         # Danh sách danh mục
       ├── SearchBar.jsx            # Thanh tìm kiếm
       └── FeaturedProducts.jsx     # Sản phẩm nổi bật
```

---

## 🔧 Backend APIs đã có

### 1. **GET /api/guest/products**
Lấy danh sách sản phẩm (có phân trang)

**Query params:**
- `page`: Trang (mặc định 1)
- `limit`: Số sản phẩm/trang (mặc định 12)
- `category`: ID danh mục (optional)
- `status`: Trạng thái (mặc định 'active')

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100
  }
}
```

### 2. **GET /api/guest/products/:id**
Xem chi tiết sản phẩm

### 3. **GET /api/guest/search?q=keyword**
Tìm kiếm sản phẩm

### 4. **GET /api/guest/categories**
Lấy danh sách danh mục

### 5. **GET /api/guest/featured?type=ending_soon&limit=6**
Sản phẩm nổi bật

**Types:**
- `ending_soon`: Sắp kết thúc
- `most_bids`: Nhiều lượt đấu
- `highest_price`: Giá cao nhất

---

## 💻 Frontend - Cách sử dụng API

### Import API service:
```javascript
import guestAPI from '../services/guestAPI'
```

### Ví dụ: Lấy sản phẩm
```javascript
const fetchProducts = async () => {
  try {
    const response = await guestAPI.getProducts({ page: 1, limit: 12 })
    setProducts(response.data)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### Ví dụ: Tìm kiếm
```javascript
const handleSearch = async (keyword) => {
  const response = await guestAPI.searchProducts(keyword)
  setSearchResults(response.data)
}
```

---

## ✅ Checklist công việc

### **Backend:**
- [x] `guestController.js` - Đã tạo sẵn
- [x] `routes/guest.js` - Đã tạo sẵn
- [ ] Test API bằng Postman/Thunder Client

### **Frontend:**
- [x] `services/guestAPI.js` - Đã tạo sẵn
- [ ] Tạo `ProductCard.jsx` - Component card sản phẩm
- [ ] Tạo `CategoryList.jsx` - Danh sách danh mục
- [ ] Tạo `SearchBar.jsx` - Thanh tìm kiếm
- [ ] Tạo `FeaturedProducts.jsx` - Sản phẩm nổi bật
- [ ] Tích hợp API vào `GuestHomePageContent.jsx`
- [ ] Test trên trình duyệt

---

## 🧪 Test APIs

### Test GET /api/guest/products
```bash
curl http://localhost:5000/api/guest/products?page=1&limit=6
```

### Test GET /api/guest/featured
```bash
curl http://localhost:5000/api/guest/featured?type=ending_soon&limit=6
```

---

## 📌 Lưu ý

1. **Không cần authentication** - Tất cả APIs là public
2. **Database tables** sử dụng:
   - `products`
   - `categories`
   - `product_descriptions`
3. **Xem thêm:**
   - Database schema: `Backend/DATABASE-SCHEMA.sql`
   - Diagram: `Backend/DATABASE-DIAGRAM.md`

---

**Good luck! 🚀**
