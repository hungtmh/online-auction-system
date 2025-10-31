# 🚀 HƯỚNG DẪN CHẠY NHANH - 3 BƯỚC

## ✅ Bước 1: Cài đặt dependencies

```bash
npm install
```

**Đợi khoảng 30-60 giây để tải các package cần thiết**

---

## ✅ Bước 2: Tạo database & dữ liệu mẫu

```bash
npm run setup
```

**Lệnh này sẽ:**
- ✅ Tạo database SQLite
- ✅ Tạo bảng users, products, bids, categories
- ✅ Seed 6 users (admin, seller, bidder)
- ✅ Seed 22 sản phẩm với hình ảnh thật
- ✅ Seed lịch sử đấu giá cho từng sản phẩm

---

## ✅ Bước 3: Chạy server

```bash
npm start
```

**Mở trình duyệt:** http://localhost:3000

---

## 🎯 Tài khoản để test

### Bidder (Người mua)
```
Email: bidder1@gmail.com
Password: 123456
```

### Seller (Người bán)
```
Email: seller1@gmail.com
Password: 123456
```

### Admin
```
Email: admin@auction.com
Password: 123456
```

---

## 💡 Các tính năng để test

1. **Xem trang chủ** - Top 5 sản phẩm gần kết thúc, nhiều lượt đấu giá, giá cao
2. **Tìm kiếm** - Tìm sản phẩm theo tên, danh mục, sắp xếp
3. **Xem chi tiết sản phẩm** - Ảnh, mô tả, lịch sử đấu giá
4. **Đăng nhập** - Dùng tài khoản test ở trên
5. **Đấu giá** - Đặt giá cho sản phẩm (phải login)
6. **Xem profile** - Sản phẩm đang đấu giá, đã thắng

---

## 🔧 Nếu gặp lỗi

### Port 3000 đã được sử dụng
```bash
# Tắt process đang chạy port 3000
# Hoặc đổi port trong server.js
```

### Muốn reset database
```bash
# Xóa file database
rm database.db

# Chạy lại setup
npm run setup
```

---

## 📝 Lưu ý quan trọng

⚠️ **Đây chỉ là MVP demo!** 

Để làm project thật, team cần:
- ✅ Migrate sang MySQL/PostgreSQL (không dùng SQLite)
- ✅ Implement đầy đủ tính năng seller, admin
- ✅ Thêm upload ảnh, email notification, etc.
- ✅ Cải thiện UI/UX
- ✅ Git commit thường xuyên!

---

**Chúc may mắn với project! 🎓**
