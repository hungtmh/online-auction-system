# SQL Script để tạo bảng users trên Supabase

## Hướng dẫn:
1. Vào https://app.supabase.com
2. Chọn project của bạn
3. Vào **SQL Editor** (biểu tượng </> bên trái)
4. Copy & paste đoạn SQL này vào
5. Click **Run** (hoặc Ctrl + Enter)

---

## Script:

```sql
-- =====================================================
-- SỬ DỤNG SUPABASE AUTH (RECOMMENDED)
-- =====================================================
-- Supabase đã có sẵn bảng auth.users với Email/Password, OAuth, Magic Link, etc.
-- Chúng ta chỉ cần tạo bảng profiles để lưu thêm thông tin

-- Tạo bảng profiles (mở rộng auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'bidder' CHECK (role IN ('admin', 'seller', 'bidder')),
  rating_positive INTEGER DEFAULT 0,
  rating_negative INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Function auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger auto-update
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'bidder'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger tự động tạo profile khi có user mới
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người đọc được profile (public)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Policy: User chỉ update được profile của chính mình
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Xem kết quả
SELECT * FROM profiles;
```

---

## Giải thích:

### Cấu trúc với Supabase Auth:

**Bảng `auth.users` (do Supabase quản lý):**
- id, email, encrypted_password
- email_confirmed_at
- last_sign_in_at
- raw_user_meta_data (JSON - lưu full_name, avatar, etc.)
- Hỗ trợ OAuth (Google, Facebook, GitHub, etc.)
- Magic Link login
- Phone authentication

**Bảng `profiles` (chúng ta tạo):**
- id → references auth.users(id)
- full_name
- role: 'admin', 'seller', 'bidder'
- rating_positive/negative

### Ưu điểm của Supabase Auth:

1. ✅ **Không cần hash password thủ công** - Supabase lo hết
2. ✅ **Email verification** tự động
3. ✅ **Password reset** built-in
4. ✅ **OAuth providers** (Google, GitHub, etc.)
5. ✅ **Magic Link** (đăng nhập không cần password)
6. ✅ **JWT tokens** tự động
7. ✅ **Row Level Security** policies
8. ✅ **Session management** tự động

### Trigger tự động:
Khi user đăng ký qua Supabase Auth → Trigger tự động tạo profile trong bảng `profiles`

---

## Test Account:

Không cần insert test user nữa!
Bạn sẽ tạo user qua:
1. Frontend Register form
2. Hoặc Supabase Dashboard → Authentication → Add User

---

## ⚡ Supabase Auth Features có sẵn:

### 1. Email/Password Authentication ✅
- Sign up với email confirmation
- Login với email/password
- Password reset qua email

### 2. OAuth Providers ✅
- Google
- GitHub
- Facebook
- Twitter
- Discord
- ...và nhiều provider khác

### 3. Magic Link ✅
- Đăng nhập không cần password
- Gửi link qua email → Click để login

### 4. Phone Authentication ✅
- Login với số điện thoại + OTP

### 5. Multi-factor Authentication (MFA) ✅
- TOTP (Time-based OTP)

---

## 🔒 Row Level Security (RLS):

Đã enable RLS với policies:
- ✅ Ai cũng xem được profiles
- ✅ User chỉ update được profile của chính mình

---

## Test Account:

Không cần insert test user nữa!
Bạn sẽ tạo user qua:
1. Frontend Register form
2. Hoặc Supabase Dashboard → Authentication → Add User

**Lưu ý:** Supabase Auth tự động hash password, gửi email verification, quản lý sessions!
