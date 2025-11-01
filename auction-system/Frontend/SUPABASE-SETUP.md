# 🚀 Hướng dẫn kết nối Supabase

## Bước 1: Tạo Supabase Project

1. Truy cập https://app.supabase.com
2. Đăng nhập hoặc đăng ký tài khoản
3. Click "New Project"
4. Điền thông tin:
   - **Name**: auction-system (hoặc tên bạn muốn)
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại!)
   - **Region**: Southeast Asia (Singapore) - gần Việt Nam nhất
5. Click "Create new project" và đợi vài phút

## Bước 2: Lấy API Credentials

1. Sau khi project được tạo, vào **Settings** (biểu tượng bánh răng bên trái)
2. Chọn **API** trong menu Settings
3. Bạn sẽ thấy:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **API Keys**: 
     - `anon` `public` key (dùng cho client-side)
     - `service_role` key (KHÔNG dùng trên client)

## Bước 3: Cập nhật file `.env`

Mở file `.env` trong thư mục `auction-system` và thay thế:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **LƯU Ý**: 
- Copy chính xác, không thêm dấu cách hay dấu ngoặc kép
- Dùng key `anon public`, KHÔNG dùng `service_role`

## Bước 4: Restart Dev Server

```bash
# Tắt server hiện tại (Ctrl + C)
# Chạy lại:
npm run dev
```

## Bước 5: Test kết nối

1. Mở http://localhost:5173
2. Click nút "🚀 Test Supabase Connection"
3. Nếu thấy "✅ Connected to Supabase!" → Thành công!

## Tạo Database Tables (Optional)

### SQL Editor trong Supabase Dashboard:

```sql
-- Table: categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id BIGINT REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users (mở rộng auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT DEFAULT 'bidder',
  rating_positive INTEGER DEFAULT 0,
  rating_negative INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  starting_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  buy_now_price DECIMAL(10,2),
  price_step DECIMAL(10,2),
  category_id BIGINT REFERENCES categories(id),
  seller_id UUID REFERENCES profiles(id),
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  bid_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bids
CREATE TABLE bids (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id),
  bidder_id UUID REFERENCES profiles(id),
  bid_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies (cho phép read public)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Public bids are viewable by everyone"
  ON bids FOR SELECT
  USING (true);

CREATE POLICY "Public categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);
```

## Ví dụ sử dụng Supabase trong code

### 1. Fetch data:
```javascript
import { supabase } from './lib/supabase'

const { data, error } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false })
```

### 2. Insert data:
```javascript
const { data, error } = await supabase
  .from('products')
  .insert([
    { title: 'iPhone 15', starting_price: 10000000 }
  ])
```

### 3. Authentication:
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()
```

## Tài liệu tham khảo

- 📚 [Supabase Docs](https://supabase.com/docs)
- 🔐 [Authentication](https://supabase.com/docs/guides/auth)
- 💾 [Database](https://supabase.com/docs/guides/database)
- 🔒 [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
