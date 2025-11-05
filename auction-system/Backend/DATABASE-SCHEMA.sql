-- ═══════════════════════════════════════════════════════════════════════════
-- ONLINE AUCTION SYSTEM - COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Project: PTUDW - Final Project - Online Auction
-- Database: Supabase PostgreSQL
-- Created: 2025-11-05
-- ═══════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. EXTENSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. ENUM TYPES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TYPE user_role AS ENUM ('guest', 'bidder', 'seller', 'admin');
CREATE TYPE product_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled');
CREATE TYPE upgrade_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending_payment', 'payment_confirmed', 'shipped', 'delivered', 'completed', 'cancelled');
CREATE TYPE rating_type AS ENUM ('positive', 'negative');


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. TABLES - USER MANAGEMENT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 3.1 profiles - Thông tin user (tự động tạo khi đăng ký)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'bidder' NOT NULL,
  date_of_birth DATE,
  address TEXT,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Rating system
  rating_positive INTEGER DEFAULT 0,
  rating_negative INTEGER DEFAULT 0,
  
  -- Account status
  is_banned BOOLEAN DEFAULT false,
  banned_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles - Bidder, Seller, Admin';
COMMENT ON COLUMN profiles.rating_positive IS 'Số lượng đánh giá tích cực (+1)';
COMMENT ON COLUMN profiles.rating_negative IS 'Số lượng đánh giá tiêu cực (-1)';


-- ─────────────────────────────────────────────────────────────────────────
-- 3.2 upgrade_requests - Yêu cầu nâng cấp bidder → seller
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status upgrade_request_status DEFAULT 'pending',
  reason TEXT,
  
  -- Admin processing
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE upgrade_requests IS 'Yêu cầu nâng cấp bidder → seller (7 ngày)';


-- ─────────────────────────────────────────────────────────────────────────
-- 3.3 ratings - Đánh giá giữa users
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID, -- Foreign key sẽ được thêm sau khi tạo bảng products
  
  rating rating_type NOT NULL, -- 'positive' or 'negative'
  comment TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Mỗi user chỉ đánh giá 1 lần cho 1 product
  UNIQUE(from_user_id, to_user_id, product_id)
);

COMMENT ON TABLE ratings IS 'Đánh giá +1/-1 giữa bidder và seller';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TABLES - CATEGORY MANAGEMENT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 4.1 categories - 2 cấp danh mục
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT, -- Cấp cha
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Danh mục 2 cấp: Điện tử → Điện thoại';
COMMENT ON COLUMN categories.parent_id IS 'NULL = cấp 1, NOT NULL = cấp 2';

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. TABLES - PRODUCT & AUCTION MANAGEMENT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 5.1 products - Sản phẩm đấu giá
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  
  -- Basic info
  name VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  
  -- Images (JSON array of URLs)
  thumbnail_url TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb, -- ["url1", "url2", "url3"]
  
  -- Pricing
  starting_price DECIMAL(15, 2) NOT NULL CHECK (starting_price >= 0),
  step_price DECIMAL(15, 2) NOT NULL CHECK (step_price > 0),
  buy_now_price DECIMAL(15, 2) CHECK (buy_now_price IS NULL OR buy_now_price > starting_price),
  current_price DECIMAL(15, 2) DEFAULT 0,
  
  -- Auction settings
  auto_extend BOOLEAN DEFAULT false, -- Tự động gia hạn
  auto_extend_minutes INTEGER DEFAULT 10, -- Gia hạn thêm 10 phút
  auto_extend_threshold INTEGER DEFAULT 5, -- Nếu bid trước 5 phút
  
  allow_unrated_bidders BOOLEAN DEFAULT true, -- Cho phép bidder chưa có rating
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status product_status DEFAULT 'pending',
  rejected_reason TEXT,
  
  -- Winner
  winner_id UUID REFERENCES profiles(id),
  final_price DECIMAL(15, 2),
  
  -- Counters
  bid_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  watchlist_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Full-text search
  search_vector tsvector
);

COMMENT ON TABLE products IS 'Sản phẩm đấu giá';
COMMENT ON COLUMN products.auto_extend IS 'Tự động gia hạn 10 phút nếu bid trước 5 phút kết thúc';
COMMENT ON COLUMN products.allow_unrated_bidders IS 'Cho phép bidder chưa có rating tham gia';

-- Indexes
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_end_time ON products(end_time);
CREATE INDEX idx_products_search ON products USING gin(search_vector);

-- Full-text search index
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);


-- ─────────────────────────────────────────────────────────────────────────
-- 5.2 product_descriptions - Lịch sử mô tả sản phẩm (append-only)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE product_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE product_descriptions IS 'Lịch sử mô tả sản phẩm (append, không được xóa)';
CREATE INDEX idx_product_descriptions_product ON product_descriptions(product_id);


-- ─────────────────────────────────────────────────────────────────────────
-- 5.3 bids - Lịch sử đấu giá
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Pricing
  bid_amount DECIMAL(15, 2) NOT NULL CHECK (bid_amount > 0),
  max_bid_amount DECIMAL(15, 2), -- Đấu giá tự động (nếu có)
  
  -- Status
  is_auto_bid BOOLEAN DEFAULT false, -- Đấu giá tự động
  is_rejected BOOLEAN DEFAULT false, -- Bị seller từ chối
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE bids IS 'Lịch sử đấu giá (thông thường + tự động)';
COMMENT ON COLUMN bids.max_bid_amount IS 'Giá tối đa cho đấu giá tự động';

CREATE INDEX idx_bids_product ON bids(product_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_created ON bids(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────
-- 5.4 watchlist - Danh sách yêu thích
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Mỗi user chỉ watch 1 lần mỗi product
  UNIQUE(user_id, product_id)
);

COMMENT ON TABLE watchlist IS 'Danh sách sản phẩm yêu thích của bidder';
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_watchlist_product ON watchlist(product_id);


-- ─────────────────────────────────────────────────────────────────────────
-- 5.5 rejected_bidders - Bidder bị từ chối đấu giá
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE rejected_bidders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  
  reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id, bidder_id)
);

COMMENT ON TABLE rejected_bidders IS 'Bidder bị seller từ chối tham gia đấu giá';
CREATE INDEX idx_rejected_bidders_product ON rejected_bidders(product_id);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. TABLES - Q&A SYSTEM
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 6.1 questions - Câu hỏi từ bidder
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  asker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  question TEXT NOT NULL,
  answer TEXT,
  
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE questions IS 'Câu hỏi & trả lời về sản phẩm';
CREATE INDEX idx_questions_product ON questions(product_id);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. TABLES - ORDER & PAYMENT MANAGEMENT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 7.1 orders - Đơn hàng sau đấu giá
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Pricing
  final_price DECIMAL(15, 2) NOT NULL,
  
  -- Shipping
  shipping_address TEXT,
  shipping_tracking_number VARCHAR(255),
  
  -- Payment
  payment_proof_url TEXT, -- Link ảnh hoá đơn thanh toán
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status order_status DEFAULT 'pending_payment',
  
  -- Delivery
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation
  cancelled_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Đơn hàng sau khi kết thúc đấu giá';
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);


-- ─────────────────────────────────────────────────────────────────────────
-- 7.2 order_chat - Chat giữa buyer & seller
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE order_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  
  message TEXT NOT NULL,
  attachment_url TEXT,
  
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE order_chat IS 'Chat giữa buyer & seller sau đấu giá';
CREATE INDEX idx_order_chat_order ON order_chat(order_id);
CREATE INDEX idx_order_chat_created ON order_chat(created_at);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. TABLES - SYSTEM SETTINGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 8.1 system_settings - Cài đặt hệ thống
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'Cài đặt hệ thống (admin có thể sửa)';

-- Default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('auto_extend_minutes', '10', 'Số phút gia hạn tự động'),
  ('auto_extend_threshold', '5', 'Gia hạn nếu bid trước X phút kết thúc'),
  ('min_rating_percentage', '80', 'Rating tối thiểu để đấu giá (%)'),
  ('new_product_highlight_minutes', '60', 'Sản phẩm mới nổi bật (phút)'),
  ('bidder_to_seller_days', '7', 'Số ngày xử lý nâng cấp bidder → seller');


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. FOREIGN KEY CONSTRAINTS (thêm sau khi tạo bảng)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE ratings 
  ADD CONSTRAINT fk_ratings_product 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 10.1 Tự động tạo profile khi user đăng ký
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'bidder'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────
-- 10.2 Tự động cập nhật updated_at
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply cho các bảng
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER upgrade_requests_updated_at BEFORE UPDATE ON upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────────────────
-- 10.3 Tự động cập nhật rating khi có đánh giá mới
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating = 'positive' THEN
    UPDATE profiles 
    SET rating_positive = rating_positive + 1 
    WHERE id = NEW.to_user_id;
  ELSE
    UPDATE profiles 
    SET rating_negative = rating_negative + 1 
    WHERE id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rating_insert AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();


-- ─────────────────────────────────────────────────────────────────────────
-- 10.4 Tự động cập nhật bid_count khi có bid mới
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_bid_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET bid_count = bid_count + 1,
      current_price = NEW.bid_amount
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bid_insert AFTER INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION update_bid_count();


-- ─────────────────────────────────────────────────────────────────────────
-- 10.5 Tự động cập nhật watchlist_count
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_watchlist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET watchlist_count = watchlist_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET watchlist_count = watchlist_count - 1 WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watchlist_change AFTER INSERT OR DELETE ON watchlist
  FOR EACH ROW EXECUTE FUNCTION update_watchlist_count();


-- ─────────────────────────────────────────────────────────────────────────
-- 10.6 Tự động cập nhật search_vector cho full-text search
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_vector_update 
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 11. FUNCTIONS - HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─────────────────────────────────────────────────────────────────────────
-- 11.1 Kiểm tra rating có đủ 80% không
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_user_rating_percentage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_ratings INTEGER;
  positive_ratings INTEGER;
  percentage DECIMAL;
BEGIN
  SELECT rating_positive, rating_negative 
  INTO positive_ratings, total_ratings
  FROM profiles 
  WHERE id = user_uuid;
  
  total_ratings := positive_ratings + total_ratings;
  
  -- Nếu chưa có rating, trả về true (được phép đấu giá)
  IF total_ratings = 0 THEN
    RETURN true;
  END IF;
  
  percentage := (positive_ratings::DECIMAL / total_ratings) * 100;
  
  RETURN percentage >= 80;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_user_rating_percentage IS 'Kiểm tra rating >= 80%';


-- ─────────────────────────────────────────────────────────────────────────
-- 11.2 Lấy top 5 sản phẩm gần kết thúc
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_ending_soon(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(500),
  current_price DECIMAL,
  end_time TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.current_price,
    p.end_time,
    p.thumbnail_url
  FROM products p
  WHERE p.status = 'active' 
    AND p.end_time > NOW()
  ORDER BY p.end_time ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────
-- 11.3 Lấy top 5 sản phẩm có nhiều bid nhất
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_most_bids(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(500),
  current_price DECIMAL,
  bid_count INTEGER,
  thumbnail_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.current_price,
    p.bid_count,
    p.thumbnail_url
  FROM products p
  WHERE p.status = 'active'
  ORDER BY p.bid_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────
-- 11.4 Lấy top 5 sản phẩm giá cao nhất
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_highest_price(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(500),
  current_price DECIMAL,
  thumbnail_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.current_price,
    p.thumbnail_url
  FROM products p
  WHERE p.status = 'active'
  ORDER BY p.current_price DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 12. ROW LEVEL SECURITY (RLS)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop policies nếu đã tồn tại
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Policies (ví dụ - có thể mở rộng)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 13. SAMPLE DATA (Optional - for testing)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Sample categories
INSERT INTO categories (id, name, slug, parent_id) VALUES
  (uuid_generate_v4(), 'Điện tử', 'dien-tu', NULL),
  (uuid_generate_v4(), 'Thời trang', 'thoi-trang', NULL),
  (uuid_generate_v4(), 'Gia dụng', 'gia-dung', NULL);

-- Subcategories
INSERT INTO categories (name, slug, parent_id) 
SELECT 'Điện thoại di động', 'dien-thoai', id FROM categories WHERE slug = 'dien-tu';

INSERT INTO categories (name, slug, parent_id) 
SELECT 'Máy tính xách tay', 'may-tinh', id FROM categories WHERE slug = 'dien-tu';

INSERT INTO categories (name, slug, parent_id) 
SELECT 'Giày dép', 'giay-dep', id FROM categories WHERE slug = 'thoi-trang';

INSERT INTO categories (name, slug, parent_id) 
SELECT 'Đồng hồ', 'dong-ho', id FROM categories WHERE slug = 'thoi-trang';


-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Total tables: 15
-- Total triggers: 7
-- Total functions: 7
-- ═══════════════════════════════════════════════════════════════════════════
