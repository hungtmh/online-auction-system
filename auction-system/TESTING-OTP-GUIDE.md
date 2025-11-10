# ✅ Hướng dẫn Test OTP Email Verification System

## 🔧 Setup đã hoàn thành:

### Backend:
- ✅ OTP Helper functions (`utils/otpHelper.js`)
- ✅ Auth Controller với OTP logic
- ✅ Routes: `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/resend-otp`
- ✅ Nodemailer đã cài đặt
- ✅ Email configuration trong `.env`

### Frontend:
- ✅ RegisterPage với OTP form
- ✅ 2-step registration flow
- ✅ Address field added
- ✅ API integration

### Database:
- ⚠️ **CẦN CHẠY SQL**: `DATABASE-OTP-TABLE.sql` trong Supabase

---

## 📋 Bước 1: Chạy SQL tạo bảng OTP

### Cách 1: Supabase Dashboard
1. Mở https://supabase.com/dashboard
2. Chọn project: `ojbcqlntvkdpdetmttuu`
3. Menu bên trái → **SQL Editor**
4. Click **New query**
5. Copy toàn bộ nội dung file `Backend/DATABASE-OTP-TABLE.sql`
6. Paste vào editor
7. Click **Run** (hoặc Ctrl+Enter)
8. Kiểm tra: Table Explorer → Xem bảng `otp_codes`

### Cách 2: psql command line
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.ojbcqlntvkdpdetmttuu.supabase.co:5432/postgres" -f Backend/DATABASE-OTP-TABLE.sql
```

---

## 📧 Bước 2: Kiểm tra Email Configuration

File `Backend/.env` phải có:

```env
EMAIL_USER=hungtmh20002@gmail.com
EMAIL_PASSWORD=cqglqqejpcvjejxy
```

### Test gửi email:
1. Start backend: `cd Backend && npm run dev`
2. Xem log console có dòng: `✅ OTP email sent to: [email]`

---

## 🚀 Bước 3: Test Full Flow

### Terminal 1 - Backend
```bash
cd Backend
npm run dev
```

**Expected output:**
```
✅ GoogleStrategy registered
╔═══════════════════════════════════════════════════╗
║   🚀 AUCTION BACKEND API RUNNING                  ║
║   📍 http://localhost:5000                       ║
╚═══════════════════════════════════════════════════╝
```

### Terminal 2 - Frontend
```bash
cd Frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms
  
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Test Cases

### Test 1: Đăng ký mới với OTP

1. **Mở browser:** http://localhost:5173
2. **Click "Đăng ký"**
3. **Điền form:**
   - Họ tên: `Nguyễn Văn Test`
   - Email: `your-test-email@gmail.com`
   - Địa chỉ: `123 Test Street, HCM`
   - Mật khẩu: `123456`
   - Xác nhận: `123456`
4. **Click "Đăng ký"**

**Expected:**
- ✅ Form chuyển sang màn hình "Xác thực Email"
- ✅ Backend console log: `✅ OTP sent to: your-test-email@gmail.com`
- ✅ Email nhận được với mã OTP 6 chữ số

5. **Kiểm tra email** → Copy mã OTP (ví dụ: `123456`)
6. **Nhập OTP** vào form
7. **Click "Xác thực OTP"**

**Expected:**
- ✅ Hiện "Xác thực thành công!"
- ✅ Auto redirect về `/login` sau 2s

### Test 2: Email trùng lặp

1. Đăng ký lại với cùng email
2. **Expected:** Lỗi "Email đã được đăng ký"

### Test 3: OTP hết hạn

1. Đăng ký với email mới
2. **Đợi 11 phút** (OTP hết hạn sau 10 phút)
3. Nhập OTP cũ
4. **Expected:** Lỗi "Mã OTP không hợp lệ hoặc đã hết hạn"

### Test 4: Resend OTP

1. Đăng ký với email mới
2. Click "Gửi lại mã OTP"
3. **Expected:** 
   - Alert "✅ Mã OTP mới đã được gửi!"
   - Email mới với OTP mới

### Test 5: Đăng nhập sau khi verify OTP

1. Hoàn thành đăng ký + verify OTP
2. Trang login → Nhập email + password
3. **Expected:** Đăng nhập thành công → Dashboard

### Test 6: Đăng nhập khi chưa verify

1. Trong database, set `email_confirmed_at = NULL` cho user test
2. Thử đăng nhập
3. **Expected:** Lỗi "Vui lòng xác nhận email trước khi đăng nhập"

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find package 'nodemailer'"
**Fix:**
```bash
cd Backend
npm install nodemailer
```

### Lỗi: "Email không gửi được"
**Check:**
1. `.env` có đúng `EMAIL_USER` và `EMAIL_PASSWORD`?
2. App Password có 16 ký tự không có khoảng trắng?
3. Gmail có bật "2-Step Verification"?

**Test email manual:**
```javascript
// Trong Backend console
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'hungtmh20002@gmail.com',
    pass: 'cqglqqejpcvjejxy'
  }
})

await transporter.sendMail({
  from: 'hungtmh20002@gmail.com',
  to: 'hungtmh20002@gmail.com',
  subject: 'Test',
  text: 'Test email'
})
```

### Lỗi: "OTP form không hiện"
**Check:**
1. Network tab → API `/auth/register` có response `requireOTPVerification: true`?
2. Frontend console có lỗi gì không?
3. `step` state có chuyển sang `'verify-otp'` không?

### Lỗi: "Port 5000 already in use"
**Fix:**
```bash
# Windows PowerShell
Get-Process -Name node | Stop-Process -Force

# Hoặc tìm và kill process cụ thể
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

---

## 📊 Database Queries hữu ích

### Xem OTP codes
```sql
SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 10;
```

### Xem users chưa verify
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL;
```

### Manual verify user (for testing)
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'test@example.com';
```

### Xóa OTP cũ
```sql
DELETE FROM otp_codes WHERE expires_at < NOW();
```

### Reset user để test lại
```sql
-- Xóa user và tất cả data liên quan
DELETE FROM profiles WHERE email = 'test@example.com';
-- User trong auth.users sẽ tự động bị xóa (CASCADE)
```

---

## ✅ Checklist trước khi Deploy

- [ ] Bảng `otp_codes` đã được tạo trong Supabase
- [ ] Email configuration trong `.env` đúng
- [ ] Test đăng ký → nhận OTP → verify → login thành công
- [ ] Test resend OTP
- [ ] Test OTP hết hạn
- [ ] Test email trùng lặp
- [ ] Backend logs không có error
- [ ] Frontend không có console error

---

## 🎯 Next Steps

1. ✅ Test full flow theo hướng dẫn trên
2. ⏳ Add reCAPTCHA v3 (optional - ngăn spam)
3. ⏳ Add rate limiting cho resend OTP (max 3 lần/10 phút)
4. ⏳ Email template đẹp hơn với branding
5. ⏳ SMS OTP support (Twilio/AWS SNS)

---

**Happy Testing! 🚀**

Nếu có lỗi, check console log của cả Backend và Frontend, và xem phần Troubleshooting ở trên.
