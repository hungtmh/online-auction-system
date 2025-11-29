# 🤖 HỆ THỐNG ĐẤU GIÁ TỰ ĐỘNG - AUTO BIDDING SYSTEM

## 📋 Tổng Quan

Hệ thống đấu giá tự động giúp người mua (bidder) có thể thắng được sản phẩm đấu giá với giá thấp nhất có thể mà không cần theo dõi liên tục.

### ✨ Tính Năng Chính

- **Đặt giá 1 lần duy nhất**: Bidder chỉ cần nhập giá tối đa mà mình sẵn sàng trả
- **Hệ thống tự động đấu giá**: Tự động tăng giá để giữ vị trí thắng cuộc
- **Giá vừa đủ thắng**: Giá hiện tại luôn là giá vừa đủ để thắng người khác, không lãng phí
- **Ưu tiên người đặt trước**: Nếu 2 bidder cùng giá tối đa, người đặt trước sẽ thắng

---

## 🎯 Cách Hoạt Động

### Ví Dụ Minh Họa

**Thông tin sản phẩm:**
- Sản phẩm: iPhone 11
- Giá khởi điểm: 10,000,000 đ
- Bước giá: 100,000 đ

**Diễn biến đấu giá:**

| Bidder | Giá tối đa | Giá vào sản phẩm | Người giữ giá | Giải thích |
|--------|-----------|------------------|---------------|------------|
| #1 | 11,000,000 | 10,000,000 | #1 | Bidder #1 đặt max 11tr, hệ thống bid starting price |
| #2 | 10,800,000 | 10,900,000 | #1 | Bidder #2 đặt max 10.8tr, hệ thống tự động tăng giá cho #1 lên 10.9tr (10.8 + 0.1) |
| #3 | 11,500,000 | 11,100,000 | #3 | Bidder #3 đặt max 11.5tr, thắng #1, giá = 11tr + 100k |
| #4 | 11,500,000 | 11,500,000 | #3 | Bidder #4 đặt max 11.5tr (cùng #3), nhưng #3 đặt trước nên thắng |
| #4 | 11,700,000 | 11,600,000 | #4 | Bidder #4 tăng max lên 11.7tr, thắng #3, giá = 11.5 + 0.1tr |

### 🔑 Nguyên Tắc Quan Trọng

1. **Giá tối đa là BÍ MẬT**: Chỉ bidder và hệ thống biết, người khác không thấy
2. **Giá hiện tại ≠ Giá tối đa**: Giá hiện tại chỉ là giá vừa đủ để thắng
3. **Người đặt trước thắng**: Nếu 2 người cùng giá max, người đặt trước ưu tiên
4. **Tự động tăng giá**: Khi có người bid cao hơn, hệ thống tự tăng giá trong phạm vi max của bạn

---

## 🛠️ Cài Đặt & Triển Khai

### 1. Database Setup

Chạy file SQL để tạo stored functions:

```bash
# Kết nối vào Supabase SQL Editor
# Copy và paste nội dung file sau:
Backend/DATABASE-AUTO-BIDDING.sql
```

**File chứa:**
- `process_auto_bid()`: Function xử lý logic đấu giá tự động
- `get_current_winner()`: Lấy thông tin người đang thắng
- `get_user_bid_status()`: Kiểm tra trạng thái bid của user

### 2. Backend API

**Files đã cập nhật:**
- `Backend/controllers/bidderController.js`
  - `placeBid()`: Đổi từ bid thủ công sang auto bid
  - `getUserBidStatus()`: API mới để kiểm tra trạng thái
  - `getCurrentWinner()`: API mới để lấy info người thắng

- `Backend/routes/bidder.js`
  - Thêm routes mới cho auto bidding

**Cách sử dụng API:**

```javascript
// Đặt giá tự động
POST /api/bidder/bids
Body: {
  "product_id": "uuid",
  "max_bid": 11000000  // Giá tối đa
}

Response (success):
{
  "success": true,
  "message": "Đặt giá tự động thành công!",
  "data": {
    "current_price": 10000000,
    "your_max_bid": 11000000,
    "is_winning": true
  }
}

Response (fail - giá thấp hơn):
{
  "success": false,
  "message": "Giá tối đa của bạn thấp hơn người đấu giá khác.",
  "data": {
    "current_price": 11100000,
    "your_max_bid": 11000000,
    "required_min_bid": 11200000
  }
}
```

```javascript
// Kiểm tra trạng thái bid của user
GET /api/bidder/products/:id/bid-status

Response:
{
  "success": true,
  "data": {
    "has_bid": true,
    "is_winning": true,
    "your_max_bid": 11000000,
    "current_price": 10000000,
    "bid_time": "2025-11-29T10:30:00Z",
    "total_bids": 5
  }
}
```

```javascript
// Lấy thông tin người đang thắng
GET /api/bidder/products/:id/current-winner

Response:
{
  "success": true,
  "data": {
    "bidder_id": "uuid",
    "bidder_name": "Nguyễn Văn A",
    "bidder_email": "email@example.com",
    "current_bid": 11000000,
    "max_bid": null,  // Ẩn
    "bid_time": "2025-11-29T10:30:00Z",
    "total_bids": 5
  }
}
```

### 3. Frontend UI

**Files đã cập nhật:**
- `Frontend/src/components/ProductDetail/BidActionPanel.jsx`
  - Thay form nhập giá thủ công → form nhập giá tối đa
  - Hiển thị hướng dẫn auto bidding
  - Real-time feedback

- `Frontend/src/services/bidderAPI.js`
  - `placeBid()`: Đổi param từ `bid_amount` → `max_bid`
  - Thêm `getUserBidStatus()`
  - Thêm `getCurrentWinner()`

**UI Mới:**

```jsx
// Form nhập giá tối đa
<input 
  type="number"
  placeholder="Nhập giá tối đa bạn sẵn sàng trả"
  // Không còn input giá cụ thể mỗi lần
/>

// Hướng dẫn
💡 Đấu giá tự động: Bạn chỉ cần nhập giá tối đa 1 lần
• Hệ thống sẽ tự động đấu giá thay bạn với giá vừa đủ thắng
• Giá khởi điểm: 10,000,000 đ
• Bước giá: 100,000 đ
```

---

## 📖 Hướng Dẫn Sử Dụng (Cho User)

### Dành Cho Bidder

1. **Vào trang chi tiết sản phẩm** muốn đấu giá

2. **Nhập giá tối đa** bạn sẵn sàng trả
   - Giá phải >= giá khởi điểm
   - Cân nhắc kỹ vì đây là giá CAO NHẤT bạn sẽ trả

3. **Nhấn "Đặt giá tự động"**
   - Hệ thống sẽ tự động bid với giá vừa đủ thắng
   - Bạn không cần làm gì thêm

4. **Theo dõi kết quả**
   - Nếu có người bid cao hơn max của bạn → Bạn thua
   - Nếu không ai bid cao hơn → Bạn thắng với giá tốt nhất
   - Nhận thông báo khi kết thúc đấu giá

### Ví Dụ Thực Tế

**Tình huống 1: Bạn thắng cuộc**
```
Bạn đặt max: 11,000,000 đ
Người khác cao nhất: 10,800,000 đ
→ Giá thắng của bạn: 10,900,000 đ (tiết kiệm 100k!)
```

**Tình huống 2: Bạn thua cuộc**
```
Bạn đặt max: 11,000,000 đ
Người khác max: 11,500,000 đ
→ Bạn thua, không mất tiền
→ Hệ thống gợi ý: Tăng max lên >= 11,600,000 đ
```

**Tình huống 3: Cùng giá max**
```
Bạn đặt max: 11,000,000 đ lúc 10:30
Người khác max: 11,000,000 đ lúc 11:00
→ Bạn thắng vì đặt trước
```

---

## 🧪 Testing

### Test Cases

1. **Test Case 1: Bidder đầu tiên**
   - Input: max_bid = 11,000,000
   - Expected: current_price = 10,000,000 (starting price)
   - Status: Winning

2. **Test Case 2: Bidder thứ 2 thấp hơn**
   - Input: max_bid = 10,800,000
   - Expected: Bidder #1 tự động tăng lên 10,900,000
   - Status: Losing

3. **Test Case 3: Bidder thứ 3 cao hơn**
   - Input: max_bid = 11,500,000
   - Expected: current_price = 11,100,000 (max của #1 + step)
   - Status: Winning

4. **Test Case 4: Cùng max_bid**
   - Input: max_bid = 11,500,000 (giống #3)
   - Expected: Reject, #3 đặt trước nên thắng
   - Message: "Vui lòng tăng giá cao hơn"

5. **Test Case 5: Tăng max_bid**
   - Input: max_bid = 11,700,000
   - Expected: current_price = 11,600,000
   - Status: Winning

### Manual Testing

```bash
# 1. Chạy backend
cd Backend
npm run dev

# 2. Chạy frontend
cd Frontend
npm run dev

# 3. Test scenarios
- Đăng nhập với 3-4 tài khoản bidder khác nhau
- Đặt giá tự động với các mức max khác nhau
- Kiểm tra current_price có đúng logic không
- Kiểm tra người thắng có ưu tiên theo thời gian không
```

---

## 🎨 So Sánh Với Hệ Thống Cũ

| Tiêu Chí | Đấu Giá Thủ Công (Cũ) | Đấu Giá Tự Động (Mới) |
|----------|------------------------|------------------------|
| **Số lần bid** | Nhiều lần | 1 lần duy nhất |
| **Theo dõi** | Phải theo dõi liên tục | Không cần theo dõi |
| **Giá trả** | Có thể trả cao hơn cần thiết | Luôn giá tối ưu |
| **Trải nghiệm** | Stress, mất thời gian | Thoải mái, tiết kiệm |
| **Chiến thắng** | Phụ thuộc may mắn | Phụ thuộc giá max |

---

## 🚀 Deployment Checklist

- [x] Database: Chạy `DATABASE-AUTO-BIDDING.sql`
- [x] Backend: Update `bidderController.js` và `routes/bidder.js`
- [x] Frontend: Update `BidActionPanel.jsx` và `bidderAPI.js`
- [x] Testing: Chạy test cases
- [ ] Production: Deploy lên server
- [ ] Monitor: Theo dõi lỗi và performance

---

## 📚 Tài Liệu Tham Khảo

- Database Schema: `Backend/DATABASE-SCHEMA.sql`
- Auto Bidding SQL: `Backend/DATABASE-AUTO-BIDDING.sql`
- Team Workflow: `TEAM-WORKFLOW.md`
- Backend README: `Backend/README.md`

---

## 🤝 Support & Issues

Nếu gặp vấn đề:
1. Check Backend logs: `console.error` trong controller
2. Check Frontend console: Network tab, response errors
3. Check Database: Xem bảng `bids` có đúng `max_bid_amount` không
4. Liên hệ team lead

---

**🎉 Hoàn thành! Hệ thống đấu giá tự động đã sẵn sàng sử dụng.**
