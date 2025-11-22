-- =====================================================
-- TẠO FULL TEST DATA CHO ADMIN DASHBOARD
-- =====================================================
-- File này tạo đầy đủ data để test tất cả tính năng Admin:
-- ✅ Users (guest, bidder, seller, admin)
-- ✅ Categories
-- ✅ Products (pending, approved, active, completed, rejected)
-- ✅ Bids
-- ✅ Upgrade Requests (pending, approved, rejected)
-- ✅ Ratings
-- ✅ Watchlist
-- =====================================================

-- =====================================================
-- 1. TẠO USERS (AUTH + PROFILES)
-- =====================================================

DO $$
DECLARE
  admin_id UUID;
  seller1_id UUID;
  seller2_id UUID;
  bidder1_id UUID;
  bidder2_id UUID;
  bidder3_id UUID;
  guest1_id UUID;
BEGIN
  -- Admin User
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@auction.com';
  
  IF admin_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@auction.com',
      crypt('Admin@123456', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      NOW(), NOW(), '', '', '', ''
    )
    RETURNING id INTO admin_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (admin_id, 'admin@auction.com', 'Admin User', 'admin', '0901234567', 'Admin Office, District 1, HCMC', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

  -- Seller 1
  SELECT id INTO seller1_id FROM auth.users WHERE email = 'seller1@test.com';
  
  IF seller1_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'seller1@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW() - INTERVAL '30 days',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Nguyễn Văn Seller"}',
      NOW() - INTERVAL '30 days', NOW(), '', '', '', ''
    )
    RETURNING id INTO seller1_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (seller1_id, 'seller1@test.com', 'Nguyễn Văn Seller', 'seller', '0912345678', '123 Nguyen Hue, District 1, HCMC', NOW() - INTERVAL '30 days', NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'seller', updated_at = NOW();

  -- Seller 2
  SELECT id INTO seller2_id FROM auth.users WHERE email = 'seller2@test.com';
  
  IF seller2_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'seller2@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW() - INTERVAL '20 days',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Trần Thị Seller"}',
      NOW() - INTERVAL '20 days', NOW(), '', '', '', ''
    )
    RETURNING id INTO seller2_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (seller2_id, 'seller2@test.com', 'Trần Thị Seller', 'seller', '0923456789', '456 Le Loi, District 3, HCMC', NOW() - INTERVAL '20 days', NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'seller', updated_at = NOW();

  -- Bidder 1
  SELECT id INTO bidder1_id FROM auth.users WHERE email = 'bidder1@test.com';
  
  IF bidder1_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'bidder1@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW() - INTERVAL '5 days',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Lê Văn Bidder"}',
      NOW() - INTERVAL '25 days', NOW(), '', '', '', ''
    )
    RETURNING id INTO bidder1_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (bidder1_id, 'bidder1@test.com', 'Lê Văn Bidder', 'bidder', '0934567890', '789 Tran Hung Dao, District 5, HCMC', NOW() - INTERVAL '25 days', NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'bidder', updated_at = NOW();

  -- Bidder 2
  SELECT id INTO bidder2_id FROM auth.users WHERE email = 'bidder2@test.com';
  
  IF bidder2_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'bidder2@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW() - INTERVAL '2 days',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Phạm Thị Bidder"}',
      NOW() - INTERVAL '15 days', NOW(), '', '', '', ''
    )
    RETURNING id INTO bidder2_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (bidder2_id, 'bidder2@test.com', 'Phạm Thị Bidder', 'bidder', '0945678901', '321 Vo Van Tan, District 3, HCMC', NOW() - INTERVAL '15 days', NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'bidder', updated_at = NOW();

  -- Bidder 3 (để test upgrade request)
  SELECT id INTO bidder3_id FROM auth.users WHERE email = 'bidder3@test.com';
  
  IF bidder3_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'bidder3@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW() - INTERVAL '1 day',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Hoàng Văn Bidder"}',
      NOW() - INTERVAL '10 days', NOW(), '', '', '', ''
    )
    RETURNING id INTO bidder3_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (bidder3_id, 'bidder3@test.com', 'Hoàng Văn Bidder', 'bidder', '0956789012', '654 Hai Ba Trung, District 1, HCMC', NOW() - INTERVAL '10 days', NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'bidder', updated_at = NOW();

  -- Guest User
  SELECT id INTO guest1_id FROM auth.users WHERE email = 'guest1@test.com';
  
  IF guest1_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'guest1@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Nguyễn Văn Guest"}',
      NOW() - INTERVAL '5 days', NOW(), '', '', '', ''
    )
    RETURNING id INTO guest1_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, address, created_at, updated_at)
  VALUES (guest1_id, 'guest1@test.com', 'Nguyễn Văn Guest', 'guest', '0967890123', '987 Cach Mang Thang Tam, District 10, HCMC', NOW() - INTERVAL '5 days', NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'guest', updated_at = NOW();

  RAISE NOTICE 'Created users successfully!';
END $$;

-- =====================================================
-- 2. TẠO CATEGORIES
-- =====================================================

DO $$
BEGIN
  -- Điện tử
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Điện tử') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Điện tử', 'dien-tu', 'Thiết bị điện tử, máy tính, điện thoại, laptop', NOW(), NOW());
  END IF;

  -- Thời trang
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Thời trang') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Thời trang', 'thoi-trang', 'Quần áo, giày dép, phụ kiện thời trang', NOW(), NOW());
  END IF;

  -- Đồ cũ
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Đồ cũ') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Đồ cũ', 'do-cu', 'Đồ cũ, đồ sưu tầm, đồ cổ', NOW(), NOW());
  END IF;

  -- Xe cộ
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Xe cộ') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Xe cộ', 'xe-co', 'Ô tô, xe máy, xe đạp', NOW(), NOW());
  END IF;

  -- Nội thất
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Nội thất') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Nội thất', 'noi-that', 'Đồ nội thất, trang trí nhà cửa', NOW(), NOW());
  END IF;

  -- Nghệ thuật
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Nghệ thuật') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Nghệ thuật', 'nghe-thuat', 'Tranh, tác phẩm nghệ thuật, đồ thủ công', NOW(), NOW());
  END IF;

  -- Sách
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sách') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Sách', 'sach', 'Sách, tạp chí, truyện tranh', NOW(), NOW());
  END IF;

  -- Thể thao
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Thể thao') THEN
    INSERT INTO categories (name, slug, description, created_at, updated_at)
    VALUES ('Thể thao', 'the-thao', 'Dụng cụ thể thao, thiết bị tập luyện', NOW(), NOW());
  END IF;

  RAISE NOTICE 'Created categories successfully!';
END $$;

-- =====================================================
-- 3. TẠO PRODUCTS (NHIỀU TRẠNG THÁI)
-- =====================================================

DO $$
DECLARE
  seller1_id UUID;
  seller2_id UUID;
  cat_electronics UUID;
  cat_fashion UUID;
  cat_antique UUID;
  cat_vehicle UUID;
  cat_furniture UUID;
  cat_art UUID;
BEGIN
  SELECT id INTO seller1_id FROM profiles WHERE email = 'seller1@test.com';
  SELECT id INTO seller2_id FROM profiles WHERE email = 'seller2@test.com';
  
  SELECT id INTO cat_electronics FROM categories WHERE name = 'Điện tử';
  SELECT id INTO cat_fashion FROM categories WHERE name = 'Thời trang';
  SELECT id INTO cat_antique FROM categories WHERE name = 'Đồ cũ';
  SELECT id INTO cat_vehicle FROM categories WHERE name = 'Xe cộ';
  SELECT id INTO cat_furniture FROM categories WHERE name = 'Nội thất';
  SELECT id INTO cat_art FROM categories WHERE name = 'Nghệ thuật';

  -- PENDING Products (chờ duyệt)
  INSERT INTO products (seller_id, category_id, name, description, starting_price, step_price, buy_now_price, start_time, end_time, status, thumbnail_url, created_at, updated_at) VALUES
  (seller1_id, cat_electronics, 'iPhone 15 Pro Max 256GB - Mới 99%', 'iPhone 15 Pro Max màu Titan Tự Nhiên, bộ nhớ 256GB, mới 99%, fullbox, còn bảo hành 10 tháng', 20000000, 500000, 28000000, NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days', 'pending', 'https://placehold.co/400x300/3b82f6/white?text=iPhone+15+Pro', NOW(), NOW()),
  (seller2_id, cat_fashion, 'Túi Xách Louis Vuitton Chính Hãng', 'Túi xách LV authentic, đã qua sử dụng nhưng còn đẹp 95%, có hóa đơn mua hàng', 15000000, 1000000, 25000000, NOW() + INTERVAL '2 days', NOW() + INTERVAL '9 days', 'pending', 'https://placehold.co/400x300/ec4899/white?text=LV+Bag', NOW(), NOW()),
  (seller1_id, cat_antique, 'Đồng Hồ Rolex Submariner Vintage', 'Đồng hồ Rolex Submariner năm 1985, còn hoạt động tốt, có giấy tờ chứng nhận', 80000000, 5000000, 150000000, NOW() + INTERVAL '3 days', NOW() + INTERVAL '10 days', 'pending', 'https://placehold.co/400x300/f59e0b/white?text=Rolex+Watch', NOW(), NOW());

  -- APPROVED Products (đã duyệt, chưa bắt đầu)
  INSERT INTO products (seller_id, category_id, name, description, starting_price, step_price, buy_now_price, start_time, end_time, status, thumbnail_url, created_at, updated_at) VALUES
  (seller1_id, cat_vehicle, 'Honda SH 2020 - Màu Đỏ Đen', 'SH 2020 màu đỏ đen, đi 15.000km, xe đẹp, máy êm, không tai nạn', 65000000, 2000000, 75000000, NOW() + INTERVAL '12 hours', NOW() + INTERVAL '7 days', 'approved', 'https://placehold.co/400x300/ef4444/white?text=Honda+SH', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  (seller2_id, cat_furniture, 'Bộ Sofa Da Thật Italia', 'Bộ sofa da bò thật nhập khẩu Italia, mới 90%, màu nâu sang trọng', 25000000, 1000000, 40000000, NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days', 'approved', 'https://placehold.co/400x300/8b5cf6/white?text=Sofa+Set', NOW() - INTERVAL '1 day', NOW());

  -- ACTIVE Products (đang đấu giá)
  INSERT INTO products (seller_id, category_id, name, description, starting_price, step_price, buy_now_price, start_time, end_time, status, thumbnail_url, created_at, updated_at) VALUES
  (seller1_id, cat_electronics, 'MacBook Pro M3 Max 2024', 'MacBook Pro 16 inch M3 Max, RAM 64GB, SSD 2TB, mới nguyên seal chưa kích hoạt', 80000000, 2000000, 95000000, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 'active', 'https://placehold.co/400x300/10b981/white?text=MacBook+Pro', NOW() - INTERVAL '5 days', NOW()),
  (seller2_id, cat_electronics, 'iPad Air M2 2024 - 256GB', 'iPad Air M2 chip, màn hình 11 inch, 256GB, màu xanh dương, mới 100%', 15000000, 500000, 18000000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 'active', 'https://placehold.co/400x300/06b6d4/white?text=iPad+Air', NOW() - INTERVAL '4 days', NOW()),
  (seller1_id, cat_art, 'Tranh Sơn Dầu Phong Cảnh Sapa', 'Tranh sơn dầu vẽ tay phong cảnh Sapa, kích thước 80x120cm, có khung gỗ', 5000000, 200000, 8000000, NOW() - INTERVAL '3 hours', NOW() + INTERVAL '4 days', 'active', 'https://placehold.co/400x300/84cc16/white?text=Oil+Painting', NOW() - INTERVAL '3 days', NOW()),
  (seller2_id, cat_fashion, 'Giày Nike Air Jordan 1 Limited', 'Nike Air Jordan 1 phiên bản giới hạn, size 42, mới 100% chưa đi', 8000000, 300000, 12000000, NOW() - INTERVAL '6 hours', NOW() + INTERVAL '3 days', 'active', 'https://placehold.co/400x300/f97316/white?text=Air+Jordan', NOW() - INTERVAL '2 days', NOW());

  -- COMPLETED Products (đã kết thúc - có người thắng)
  INSERT INTO products (seller_id, category_id, name, description, starting_price, step_price, buy_now_price, start_time, end_time, status, thumbnail_url, created_at, updated_at) VALUES
  (seller1_id, cat_electronics, 'Samsung Galaxy S24 Ultra 512GB', 'Samsung S24 Ultra, RAM 12GB, bộ nhớ 512GB, màu đen titan, fullbox', 22000000, 500000, 28000000, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 'completed', 'https://placehold.co/400x300/6366f1/white?text=Galaxy+S24', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
  (seller2_id, cat_furniture, 'Bàn Làm Việc Gỗ Óc Chó', 'Bàn làm việc gỗ óc chó tự nhiên, kích thước 1m6, thiết kế hiện đại', 8000000, 300000, 12000000, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day', 'completed', 'https://placehold.co/400x300/14b8a6/white?text=Work+Desk', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day');

  -- REJECTED Products (bị từ chối)
  INSERT INTO products (seller_id, category_id, name, description, starting_price, step_price, buy_now_price, start_time, end_time, status, thumbnail_url, created_at, updated_at) VALUES
  (seller1_id, cat_electronics, 'iPhone 6 Quốc Tế - Hàng Lướt', 'iPhone 6 màu gray, 64GB, còn dùng tốt', 2000000, 100000, 3000000, NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days', 'rejected', 'https://placehold.co/400x300/64748b/white?text=iPhone+6', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  (seller2_id, cat_fashion, 'Áo Thun Replica Supreme', 'Áo thun Supreme fake 1:1, chất lượng cao', 500000, 50000, 800000, NOW() + INTERVAL '2 days', NOW() + INTERVAL '9 days', 'rejected', 'https://placehold.co/400x300/64748b/white?text=Supreme+Tee', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

  -- CANCELLED Products (bị hủy)
  INSERT INTO products (seller_id, category_id, name, description, starting_price, step_price, buy_now_price, start_time, end_time, status, thumbnail_url, created_at, updated_at) VALUES
  (seller1_id, cat_vehicle, 'Xe Máy Wave RSX Đời 2015', 'Wave RSX 2015, màu đỏ đen, đi 50.000km', 12000000, 500000, 15000000, NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 'cancelled', 'https://placehold.co/400x300/64748b/white?text=Wave+RSX', NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days');

  RAISE NOTICE 'Created products successfully!';
END $$;

-- =====================================================
-- 4. TẠO BIDS (ĐẤU GIÁ)
-- =====================================================

DO $$
DECLARE
  bidder1_id UUID;
  bidder2_id UUID;
  product_macbook UUID;
  product_ipad UUID;
  product_painting UUID;
  product_jordan UUID;
  product_samsung UUID;
  product_desk UUID;
BEGIN
  SELECT id INTO bidder1_id FROM profiles WHERE email = 'bidder1@test.com';
  SELECT id INTO bidder2_id FROM profiles WHERE email = 'bidder2@test.com';
  
  SELECT id INTO product_macbook FROM products WHERE name LIKE 'MacBook Pro M3%';
  SELECT id INTO product_ipad FROM products WHERE name LIKE 'iPad Air M2%';
  SELECT id INTO product_painting FROM products WHERE name LIKE 'Tranh Sơn Dầu%';
  SELECT id INTO product_jordan FROM products WHERE name LIKE 'Giày Nike Air Jordan%';
  SELECT id INTO product_samsung FROM products WHERE name LIKE 'Samsung Galaxy S24%';
  SELECT id INTO product_desk FROM products WHERE name LIKE 'Bàn Làm Việc%';

  -- Bids cho MacBook (active)
  INSERT INTO bids (product_id, bidder_id, bid_amount, created_at) VALUES
  (product_macbook, bidder1_id, 82000000, NOW() - INTERVAL '2 days'),
  (product_macbook, bidder2_id, 84000000, NOW() - INTERVAL '1 day 12 hours'),
  (product_macbook, bidder1_id, 86000000, NOW() - INTERVAL '1 day'),
  (product_macbook, bidder2_id, 88000000, NOW() - INTERVAL '6 hours'),
  (product_macbook, bidder1_id, 90000000, NOW() - INTERVAL '2 hours');

  -- Bids cho iPad (active)
  INSERT INTO bids (product_id, bidder_id, bid_amount, created_at) VALUES
  (product_ipad, bidder2_id, 15500000, NOW() - INTERVAL '1 day'),
  (product_ipad, bidder1_id, 16000000, NOW() - INTERVAL '12 hours'),
  (product_ipad, bidder2_id, 16500000, NOW() - INTERVAL '3 hours');

  -- Bids cho Painting (active)
  INSERT INTO bids (product_id, bidder_id, bid_amount, created_at) VALUES
  (product_painting, bidder1_id, 5200000, NOW() - INTERVAL '3 hours'),
  (product_painting, bidder2_id, 5400000, NOW() - INTERVAL '1 hour');

  -- Bids cho Air Jordan (active)
  INSERT INTO bids (product_id, bidder_id, bid_amount, created_at) VALUES
  (product_jordan, bidder2_id, 8300000, NOW() - INTERVAL '6 hours'),
  (product_jordan, bidder1_id, 8600000, NOW() - INTERVAL '4 hours'),
  (product_jordan, bidder2_id, 8900000, NOW() - INTERVAL '2 hours');

  -- Bids cho Samsung (completed - bidder2 thắng)
  INSERT INTO bids (product_id, bidder_id, bid_amount, created_at) VALUES
  (product_samsung, bidder1_id, 22500000, NOW() - INTERVAL '10 days'),
  (product_samsung, bidder2_id, 23000000, NOW() - INTERVAL '9 days'),
  (product_samsung, bidder1_id, 23500000, NOW() - INTERVAL '8 days'),
  (product_samsung, bidder2_id, 24000000, NOW() - INTERVAL '7 days'),
  (product_samsung, bidder1_id, 24500000, NOW() - INTERVAL '6 days'),
  (product_samsung, bidder2_id, 25000000, NOW() - INTERVAL '5 days');

  -- Bids cho Desk (completed - bidder1 thắng)
  INSERT INTO bids (product_id, bidder_id, bid_amount, created_at) VALUES
  (product_desk, bidder2_id, 8300000, NOW() - INTERVAL '8 days'),
  (product_desk, bidder1_id, 8600000, NOW() - INTERVAL '7 days'),
  (product_desk, bidder2_id, 8900000, NOW() - INTERVAL '6 days'),
  (product_desk, bidder1_id, 9200000, NOW() - INTERVAL '5 days');

  RAISE NOTICE 'Created bids successfully!';
END $$;

-- =====================================================
-- 5. TẠO UPGRADE REQUESTS
-- =====================================================

DO $$
DECLARE
  bidder1_id UUID;
  bidder2_id UUID;
  bidder3_id UUID;
  admin_id UUID;
BEGIN
  SELECT id INTO bidder1_id FROM profiles WHERE email = 'bidder1@test.com';
  SELECT id INTO bidder2_id FROM profiles WHERE email = 'bidder2@test.com';
  SELECT id INTO bidder3_id FROM profiles WHERE email = 'bidder3@test.com';
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@auction.com';

  -- PENDING upgrade request
  INSERT INTO upgrade_requests (user_id, reason, status, created_at, updated_at) VALUES
  (bidder3_id, 'Tôi muốn nâng cấp lên seller để bán các sản phẩm điện tử cũ của mình. Tôi có kinh nghiệm bán hàng trên các sàn thương mại điện tử khác.', 'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

  -- APPROVED upgrade request (bidder1 đã được duyệt)
  INSERT INTO upgrade_requests (user_id, reason, status, reviewed_by, reviewed_at, created_at, updated_at) VALUES
  (bidder1_id, 'Tôi muốn trở thành seller để bán đồ cũ và đồ sưu tầm. Tôi cam kết bán hàng chính hãng và chất lượng.', 'approved', admin_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days');

  -- REJECTED upgrade request (bidder2 bị từ chối)
  INSERT INTO upgrade_requests (user_id, reason, status, reviewed_by, reviewed_at, admin_note, created_at, updated_at) VALUES
  (bidder2_id, 'Muốn bán hàng', 'rejected', admin_id, NOW() - INTERVAL '10 days', 'Bị từ chối vì lý do không đủ chi tiết. Vui lòng mô tả rõ hơn về loại sản phẩm và kinh nghiệm bán hàng.', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days');

  RAISE NOTICE 'Created upgrade requests successfully!';
END $$;

-- =====================================================
-- 6. TẠO WATCHLIST
-- =====================================================

DO $$
DECLARE
  bidder1_id UUID;
  bidder2_id UUID;
  product_macbook UUID;
  product_ipad UUID;
  product_jordan UUID;
BEGIN
  SELECT id INTO bidder1_id FROM profiles WHERE email = 'bidder1@test.com';
  SELECT id INTO bidder2_id FROM profiles WHERE email = 'bidder2@test.com';
  
  SELECT id INTO product_macbook FROM products WHERE name LIKE 'MacBook Pro M3%';
  SELECT id INTO product_ipad FROM products WHERE name LIKE 'iPad Air M2%';
  SELECT id INTO product_jordan FROM products WHERE name LIKE 'Giày Nike Air Jordan%';

  INSERT INTO watchlist (user_id, product_id, created_at) VALUES
  (bidder1_id, product_macbook, NOW() - INTERVAL '5 days'),
  (bidder1_id, product_ipad, NOW() - INTERVAL '4 days'),
  (bidder2_id, product_macbook, NOW() - INTERVAL '3 days'),
  (bidder2_id, product_jordan, NOW() - INTERVAL '2 days');

  RAISE NOTICE 'Created watchlist successfully!';
END $$;

-- =====================================================
-- 7. TẠO RATINGS
-- =====================================================

DO $$
DECLARE
  bidder1_id UUID;
  bidder2_id UUID;
  seller1_id UUID;
  seller2_id UUID;
  product_samsung UUID;
  product_desk UUID;
BEGIN
  SELECT id INTO bidder1_id FROM profiles WHERE email = 'bidder1@test.com';
  SELECT id INTO bidder2_id FROM profiles WHERE email = 'bidder2@test.com';
  SELECT id INTO seller1_id FROM profiles WHERE email = 'seller1@test.com';
  SELECT id INTO seller2_id FROM profiles WHERE email = 'seller2@test.com';
  
  SELECT id INTO product_samsung FROM products WHERE name LIKE 'Samsung Galaxy S24%';
  SELECT id INTO product_desk FROM products WHERE name LIKE 'Bàn Làm Việc%';

  -- Rating cho Samsung (bidder2 đánh giá seller1)
  INSERT INTO ratings (product_id, from_user_id, to_user_id, rating, comment, created_at) VALUES
  (product_samsung, bidder2_id, seller1_id, 'positive', 'Sản phẩm đúng mô tả, đóng gói cẩn thận, seller nhiệt tình. Rất hài lòng!', NOW() - INTERVAL '2 days');

  -- Rating cho Desk (bidder1 đánh giá seller2)
  INSERT INTO ratings (product_id, from_user_id, to_user_id, rating, comment, created_at) VALUES
  (product_desk, bidder1_id, seller2_id, 'positive', 'Bàn đẹp, chất lượng tốt. Trừ 1 chút vì giao hàng hơi chậm.', NOW() - INTERVAL '12 hours');

  RAISE NOTICE 'Created ratings successfully!';
END $$;

-- =====================================================
-- KIỂM TRA KẾT QUẢ
-- =====================================================

-- Tổng quan users
SELECT 
  role,
  COUNT(*) as total_users
FROM profiles
GROUP BY role
ORDER BY role;

-- Tổng quan products
SELECT 
  status,
  COUNT(*) as total_products
FROM products
GROUP BY status
ORDER BY status;

-- Tổng quan bids
SELECT 
  COUNT(*) as total_bids,
  COUNT(DISTINCT product_id) as products_with_bids,
  COUNT(DISTINCT bidder_id) as unique_bidders
FROM bids;

-- Tổng quan upgrade requests
SELECT 
  status,
  COUNT(*) as total_requests
FROM upgrade_requests
GROUP BY status
ORDER BY status;

-- =====================================================
-- THÔNG TIN ĐĂNG NHẬP
-- =====================================================
-- Admin:
--   Email: admin@auction.com
--   Password: Admin@123456
--
-- Sellers:
--   Email: seller1@test.com / seller2@test.com
--   Password: 123456
--
-- Bidders:
--   Email: bidder1@test.com / bidder2@test.com / bidder3@test.com
--   Password: 123456
--
-- Guest:
--   Email: guest1@test.com
--   Password: 123456
-- =====================================================
