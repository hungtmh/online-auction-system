# Hướng Dẫn Cấu Hình Email

## 1. Cấu hình môi trường (.env)

Thêm các biến sau vào file `.env`:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="Auction System" <your-email@gmail.com>
```

## 2. Cách lấy App Password cho Gmail

1. Đăng nhập vào Google Account: https://myaccount.google.com/
2. Vào **Security** → **2-Step Verification** (phải bật trước)
3. Sau khi bật 2-Step Verification, quay lại và tìm **App passwords**
4. Chọn app: **Mail**, device: **Other** (đặt tên "Auction System")
5. Click **Generate** → Copy mật khẩu 16 ký tự
6. Dán vào `MAIL_PASS` trong file `.env`

## 3. Các loại email thông báo

Hệ thống gửi email tự động cho các sự kiện sau:

| Sự kiện | Người nhận | Mô tả |
|---------|------------|-------|
| Ra giá mới | Seller | Thông báo có người đặt giá mới |
| Ra giá thành công | Bidder | Xác nhận đã đặt giá |
| Bị vượt giá | Previous bidder | Thông báo giá của bạn đã bị vượt |
| Bị từ chối | Rejected bidder | Thông báo giá của bạn bị từ chối |
| Đấu giá kết thúc (không winner) | Seller | Thông báo không có ai thắng |
| Đấu giá kết thúc (có winner) | Seller + Winner | Thông báo kết quả đấu giá |
| Câu hỏi mới | Seller | Có người hỏi về sản phẩm |
| Trả lời câu hỏi | All bidders + askers | Seller đã trả lời câu hỏi |

## 4. Scheduler tự động

- Scheduler chạy mỗi **60 giây**
- Kiểm tra các đấu giá đã kết thúc (`end_time < now` và `status = 'active'`)
- Tự động:
  - Cập nhật status → `sold` (có winner) hoặc `ended` (không có winner)
  - Tạo order cho winner
  - Gửi email thông báo

## 5. Testing

Để test email:

```bash
# Restart server để load config mới
npm run dev

# Thử các action:
# - Đặt giá trên một sản phẩm → Check email seller, bidder
# - Seller từ chối bid → Check email bidder bị từ chối
# - Đặt câu hỏi → Check email seller
# - Seller trả lời → Check email các bidder
```

## 6. Troubleshooting

### Lỗi "Invalid login"
- Kiểm tra lại App Password (không phải password thường)
- Đảm bảo 2-Step Verification đã bật

### Lỗi "Connection refused"
- Kiểm tra MAIL_HOST và MAIL_PORT
- Gmail: smtp.gmail.com:587

### Email không gửi được
- Check console log server
- Đảm bảo MAIL_USER và MAIL_FROM giống nhau

### Scheduler không chạy
- Check log `[AuctionScheduler]` trong console
- Đảm bảo server đã khởi động thành công
