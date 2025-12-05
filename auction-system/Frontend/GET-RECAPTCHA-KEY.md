# 🔐 Hướng dẫn lấy Google reCAPTCHA Site Key

## ⚠️ Quan trọng:

Hiện tại code đang dùng **TEST KEY** của Google:

```javascript
sitekey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
```

**Test key này chỉ để development**, sẽ LUÔN PASS mọi verify request.

Khi deploy production, **BẮT BUỘC** phải thay bằng key thật!

---

## 📋 Bước 1: Đăng ký reCAPTCHA

1. **Truy cập:** https://www.google.com/recaptcha/admin/create
2. **Đăng nhập** bằng Google Account

---

## 📋 Bước 2: Tạo Site mới

### Label (Tên site):

```
Auction System - Production
```

### reCAPTCHA type:

Chọn **reCAPTCHA v2** → **"I'm not a robot" Checkbox**

### Domains:

Nhập domain của bạn (mỗi dòng 1 domain):

**Development:**

```
localhost
```

**Production (khi deploy):**

```
yourdomain.com
www.yourdomain.com
```

### Owners:

- Mặc định là email Google của bạn
- Có thể thêm email teamate khác

### Accept reCAPTCHA Terms of Service

☑️ Tick vào checkbox

### Click **SUBMIT**

---

## 📋 Bước 3: Lấy Keys

Sau khi submit, bạn sẽ nhận được 2 keys:

### 1. **Site Key** (Public key)

```
Ví dụ: 6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

- Key này được dùng trong **Frontend** (React component)
- Có thể public, không cần giấu

### 2. **Secret Key** (Private key)

```
Ví dụ: 6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

- Key này được dùng trong **Backend** để verify
- **PHẢI GIỮ BÍ MẬT**, không commit lên Git

---

## 📋 Bước 4: Update Frontend

Mở file: `Frontend/src/pages/RegisterPage.jsx`

Tìm dòng:

```jsx
sitekey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key
```

Thay bằng:

```jsx
sitekey = "YOUR_SITE_KEY_HERE";
```

**HOẶC** dùng environment variable (recommended):

1. Tạo file `Frontend/.env`:

```env
VITE_RECAPTCHA_SITE_KEY=YOUR_SITE_KEY_HERE
```

2. Update RegisterPage.jsx:

```jsx
sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
```

---

## 📋 Bước 5: Update Backend (Optional - nếu muốn verify ở server)

Nếu muốn **double-check** reCAPTCHA ở backend:

### 5.1: Thêm vào `.env`:

```env
RECAPTCHA_SECRET_KEY=YOUR_SECRET_KEY_HERE
```

### 5.2: Update `authController.js`:

```javascript
// Trong hàm register()
const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  const response = await fetch(verifyUrl, { method: "POST" });
  const data = await response.json();

  return data.success;
};

// Validate reCAPTCHA token từ client
const recaptchaToken = req.body.recaptchaToken;
if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
  return res.status(400).json({
    success: false,
    message: "reCAPTCHA verification failed",
  });
}
```

### 5.3: Update Frontend `api.js`:

```javascript
register: async (email, password, fullName, address, recaptchaToken) => {
  const response = await api.post("/auth/register", {
    email,
    password,
    full_name: fullName,
    address,
    recaptchaToken, // ← Gửi token lên backend
  });
  return response.data;
};
```

---

## ✅ Checklist

- [ ] Đăng ký reCAPTCHA tại https://www.google.com/recaptcha/admin
- [ ] Lấy Site Key (public)
- [ ] Lấy Secret Key (private) - nếu cần verify backend
- [ ] Thay test key trong `RegisterPage.jsx`
- [ ] (Optional) Thêm Secret Key vào Backend `.env`
- [ ] (Optional) Implement backend verification
- [ ] Test trên localhost
- [ ] Update domains khi deploy production

---

## 🧪 Test reCAPTCHA

### Development (test key):

- ✅ Luôn pass, không cần click checkbox thật

### Production (real key):

1. Mở form đăng ký
2. Điền thông tin
3. **Click checkbox "I'm not a robot"**
4. (Có thể phải làm captcha challenge - chọn hình)
5. Submit form
6. Check console.log để xem token được gửi

---

## 🔗 Tài liệu tham khảo

- **reCAPTCHA Admin Console:** https://www.google.com/recaptcha/admin
- **reCAPTCHA v2 Docs:** https://developers.google.com/recaptcha/docs/display
- **Verify API:** https://developers.google.com/recaptcha/docs/verify
- **react-google-recaptcha:** https://www.npmjs.com/package/react-google-recaptcha

---

## ⚠️ Lưu ý

1. **Test key chỉ dùng cho localhost/development**
2. **Production PHẢI dùng real key**
3. **Secret key KHÔNG ĐƯỢC commit lên Git** (dùng .env và .gitignore)
4. **Domain phải khớp** với domain đã đăng ký
5. reCAPTCHA v2 có thể bị block nếu user dùng VPN/Tor

---

**Happy securing! 🔒**
