# 👤 PHẦN CÔNG VIỆC CỦA KHOA - BIDDER DASHBOARD

## 🎯 Nhiệm vụ

Dashboard cho người mua, xem sản phẩm, đấu giá, theo dõi watchlist, lịch sử đấu giá.

---

## 📂 Files của bạn

### **Backend:**
```
✅ controllers/bidderController.js  # Đã tạo sẵn
✅ routes/bidder.js                 # Đã tạo sẵn
```

### **Frontend:**
```
✅ pages/BidderDashboard.jsx        # Đã có template
✅ services/bidderAPI.js            # Đã tạo sẵn

📝 TODO: Tạo components
   └── components/Bidder/
       ├── ProductList.jsx      # Danh sách sản phẩm đấu giá
       ├── BidForm.jsx          # Form đặt giá
       ├── MyBids.jsx           # Lịch sử đấu giá của tôi
       ├── Watchlist.jsx        # Danh sách theo dõi
       ├── BidHistory.jsx       # Lịch sử giá đấu
       └── ProductDetail.jsx    # Chi tiết sản phẩm
```

---

## 🔧 Backend APIs đã có

### 1. **GET /api/bidder/products**
Lấy sản phẩm đấu giá

**Query params:**
- `page`, `limit`: Phân trang
- `category`: Lọc theo danh mục
- `sort`: `ending_soon` | `price_low` | `price_high`

### 2. **POST /api/bidder/bids**
Đặt giá đấu

**Body:**
```json
{
  "product_id": "uuid",
  "bid_amount": 1000000
}
```

### 3. **GET /api/bidder/bids/my**
Lịch sử đấu giá của tôi

### 4. **POST /api/bidder/watchlist**
Thêm vào watchlist

**Body:**
```json
{
  "product_id": "uuid"
}
```

### 5. **DELETE /api/bidder/watchlist/:productId**
Xóa khỏi watchlist

### 6. **GET /api/bidder/watchlist**
Lấy danh sách watchlist

### 7. **GET /api/bidder/products/:id/bids**
Lịch sử giá đấu của sản phẩm

---

## 💻 Frontend - Cách sử dụng API

### Import API service:
```javascript
import bidderAPI from '../services/bidderAPI'
```

### Ví dụ: Lấy sản phẩm đấu giá
```javascript
const fetchProducts = async () => {
  const response = await bidderAPI.getAuctionProducts({ 
    page: 1, 
    limit: 12,
    sort: 'ending_soon' 
  })
  setProducts(response.data)
}
```

### Ví dụ: Đặt giá
```javascript
const handlePlaceBid = async (productId, amount) => {
  try {
    await bidderAPI.placeBid(productId, amount)
    alert('Đặt giá thành công!')
  } catch (error) {
    alert(error.response?.data?.message || 'Lỗi đặt giá')
  }
}
```

### Ví dụ: Thêm watchlist
```javascript
const handleAddWatchlist = async (productId) => {
  await bidderAPI.addToWatchlist(productId)
}
```

---

## ✅ Checklist công việc

### **Backend:**
- [x] `bidderController.js` - Đã tạo sẵn
- [x] `routes/bidder.js` - Đã tạo sẵn
- [ ] Test API bằng Postman với Bearer token

### **Frontend:**
- [x] `services/bidderAPI.js` - Đã tạo sẵn
- [ ] Tạo `ProductList.jsx` - Danh sách sản phẩm
- [ ] Tạo `BidForm.jsx` - Form đặt giá
- [ ] Tạo `MyBids.jsx` - Lịch sử đấu giá
- [ ] Tạo `Watchlist.jsx` - Watchlist
- [ ] Tạo `BidHistory.jsx` - Lịch sử giá đấu
- [ ] Tích hợp vào `BidderDashboard.jsx`
- [ ] Test đấu giá thực tế

---

## 🧪 Test APIs (cần đăng nhập)

### 1. Login để lấy token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bidder@test.com","password":"123456"}'
```

### 2. Test đặt giá
```bash
curl -X POST http://localhost:5000/api/bidder/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"uuid","bid_amount":1000000}'
```

---

## 📌 Lưu ý

1. **Cần authentication** - Tất cả APIs yêu cầu `role = bidder`
2. **Validation đặt giá:**
   - Giá đấu phải lớn hơn `current_price + step_price`
   - Không được đấu giá sản phẩm đã kết thúc
   - Kiểm tra `rejected_bidders` table
3. **Database tables:**
   - `bids` (tạo, đọc)
   - `watchlist` (tạo, đọc, xóa)
   - `products` (đọc)

---

**Good luck! 🚀**
