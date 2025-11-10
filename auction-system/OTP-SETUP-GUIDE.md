# 🔐 Hệ Thống OTP Email Verification

## ✨ Tính năng mới đã thêm

### Backend
1. **OTP System**:
   - Tạo mã OTP 6 chữ số ngẫu nhiên
   - Gửi OTP qua email (Gmail SMTP)
   - Lưu OTP trong database với thời hạn 10 phút
   - Verify OTP khi đăng ký

2. **Database**:
   - Bảng `otp_codes` để lưu trữ OTP
   - Update bảng `profiles` đã có sẵn field `address`

3. **API Endpoints**:
   - `POST /api/auth/register` - Đăng ký + gửi OTP
   - `POST /api/auth/verify-otp` - Xác thực OTP
   - `POST /api/auth/resend-otp` - Gửi lại OTP

4. **Email Configuration**:
   - Sử dụng Nodemailer với Gmail SMTP
   - Template email đẹp với HTML

### Frontend
1. **Register Form**:
   - Thêm field `address` (địa chỉ)
   - Email không được trùng (validate backend)
   - 2-step registration: Register → Verify OTP

2. **OTP Verification Screen**:
   - Input 6 chữ số tự động format
   - Countdown 10 phút
   - Resend OTP button

## 📋 Setup Instructions

### 1. Setup Database

Chạy SQL script để tạo bảng OTP:

\`\`\`sql
-- File: Backend/DATABASE-OTP-TABLE.sql
-- Chạy trong Supabase SQL Editor
\`\`\`

### 2. Setup Email (Gmail)

1. **Bật 2-Step Verification** cho Gmail account
   - Vào: https://myaccount.google.com/security

2. **Tạo App Password**:
   - Vào: https://myaccount.google.com/apppasswords
   - Chọn app: "Mail"
   - Chọn device: "Other" → Nhập "Auction System"
   - Copy password 16 ký tự

3. **Update Backend `.env`**:
\`\`\`env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
\`\`\`

### 3. Install Dependencies

**Backend**:
\`\`\`bash
cd Backend
npm install nodemailer
\`\`\`

**Frontend**: (Không cần thêm package mới)

### 4. Start Services

**Backend**:
\`\`\`bash
cd Backend
npm run dev
\`\`\`

**Frontend**:
\`\`\`bash
cd Frontend
npm run dev
\`\`\`

## 🎯 User Flow

### Đăng ký mới:
1. User điền form đăng ký (email, password, họ tên, địa chỉ)
2. Backend kiểm tra email đã tồn tại chưa
3. Tạo user + gửi OTP qua email
4. User nhập mã OTP 6 chữ số
5. Backend verify OTP → confirm email
6. Redirect về trang login

### Đăng nhập:
1. Email phải đã verified (qua OTP)
2. Nếu chưa verify → hiện lỗi + button resend OTP

## 🔄 TODO - reCAPTCHA

**Google reCAPTCHA v3** sẽ được thêm sau:

1. **Setup Google reCAPTCHA**:
   - Đăng ký tại: https://www.google.com/recaptcha/admin
   - Chọn reCAPTCHA v3
   - Thêm domain: `localhost` (dev), `yourdomain.com` (production)

2. **Frontend**:
   - Cài `react-google-recaptcha-v3`
   - Wrap Register form với ReCaptchaProvider
   - Execute reCAPTCHA khi submit

3. **Backend**:
   - Verify reCAPTCHA token với Google API
   - Reject nếu score < 0.5

## 📝 Files Created/Modified

### Backend:
- ✅ `utils/otpHelper.js` - OTP helper functions
- ✅ `DATABASE-OTP-TABLE.sql` - OTP table schema
- ✅ `controllers/authController.js` - Updated với OTP logic
- ✅ `routes/auth.js` - Thêm verify-otp endpoint
- ✅ `package.json` - Thêm nodemailer
- ✅ `.env` - Thêm EMAIL_USER, EMAIL_PASSWORD

### Frontend:
- ✅ `services/api.js` - Thêm verifyOTP, resendOTP
- ✅ `components/Auth/RegisterNew.jsx` - Form đăng ký mới với OTP
- ⚠️ `components/Auth/Register.jsx` - Cần replace với RegisterNew.jsx

## 🐛 Troubleshooting

### Email không gửi được:
- Kiểm tra EMAIL_USER, EMAIL_PASSWORD trong `.env`
- Kiểm tra App Password có đúng không
- Kiểm tra Gmail chưa block "Less secure app"
- Xem console log backend có lỗi gì không

### OTP không verify được:
- Kiểm tra database có bảng `otp_codes` chưa
- OTP có hết hạn chưa (10 phút)
- Kiểm tra email và OTP code có khớp không

### Login bị lỗi server:
- ✅ Đã fix: Không dùng `listUsers()` nữa
- Query từ bảng `profiles` thay vì

## 🚀 Next Steps

1. ✅ Fix login lỗi server
2. ✅ Thêm OTP system
3. ✅ Thêm address field
4. ⏳ Thêm reCAPTCHA
5. ⏳ Test toàn bộ flow

---

**Author**: TayDuKy Team  
**Date**: 2025-11-10
