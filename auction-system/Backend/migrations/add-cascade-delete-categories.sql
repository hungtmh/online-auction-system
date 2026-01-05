-- ================================================================
-- Migration: Add CASCADE DELETE for categories and products
-- Purpose: Khi xóa category -> xóa products -> xóa tất cả dữ liệu liên quan
-- Date: 2026-01-05
-- ================================================================

BEGIN;

-- ================================================================
-- BƯỚC 1: XÓA CÁC FOREIGN KEY CŨ (KHÔNG CÓ CASCADE)
-- ================================================================

-- Xóa constraint cũ của products.category_id
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Xóa constraint cũ của bids.product_id  
ALTER TABLE public.bids 
  DROP CONSTRAINT IF EXISTS bids_product_id_fkey;

-- Xóa constraint cũ của watchlist.product_id
ALTER TABLE public.watchlist 
  DROP CONSTRAINT IF EXISTS watchlist_product_id_fkey;

-- Xóa constraint cũ của product_descriptions.product_id
ALTER TABLE public.product_descriptions 
  DROP CONSTRAINT IF EXISTS product_descriptions_product_id_fkey;

-- Xóa constraint cũ của ratings.product_id
ALTER TABLE public.ratings 
  DROP CONSTRAINT IF EXISTS ratings_product_id_fkey;

-- Xóa constraint cũ của orders.product_id
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_product_id_fkey;

-- Xóa constraint cũ của product_allowed_bidders.product_id
ALTER TABLE public.product_allowed_bidders 
  DROP CONSTRAINT IF EXISTS product_allowed_bidders_product_id_fkey;

-- Xóa constraint cũ của categories.parent_id (category con)
ALTER TABLE public.categories 
  DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;

-- ================================================================
-- BƯỚC 1.5: CHO PHÉP product_id TRONG ORDERS CÓ THỂ NULL
-- ================================================================
-- Bỏ NOT NULL constraint để có thể SET NULL khi xóa product
ALTER TABLE public.orders 
  ALTER COLUMN product_id DROP NOT NULL;

-- ================================================================
-- BƯỚC 2: THÊM LẠI FOREIGN KEY VỚI CASCADE DELETE
-- ================================================================

-- 1. Categories -> Categories (CASCADE DELETE) 
-- Khi xóa category cha -> tự động xóa tất cả category con
ALTER TABLE public.categories 
  ADD CONSTRAINT categories_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;

-- 3. Categories -> Products (CASCADE DELETE)
-- Khi xóa category -> tự động xóa tất cả products thuộc category đó
ALTER TABLE public.products 
  ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;

-- 2. Products -> Bids (CASCADE DELETE)
-- Khi xóa product -> tự động xóa tất cả bids
ALTER TABLE public.bids 
  ADD CONSTRAINT bids_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- 4. Products -> Watchlist (CASCADE DELETE)
-- Khi xóa product -> tự động xóa khỏi watchlist
ALTER TABLE public.watchlist 
  ADD CONSTRAINT watchlist_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- 5. Products -> Product Descriptions (CASCADE DELETE)
-- Khi xóa product -> tự động xóa descriptions
ALTER TABLE public.product_descriptions 
  ADD CONSTRAINT product_descriptions_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- 6. Products -> Ratings (CASCADE DELETE)
-- Khi xóa product -> tự động xóa ratings
ALTER TABLE public.ratings 
  ADD CONSTRAINT ratings_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- 7. Products -> Orders (SET NULL)
-- Khi xóa product -> orders vẫn giữ lại nhưng product_id = NULL (để giữ lịch sử)
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE SET NULL;

-- 8. Products -> Product Allowed Bidders (CASCADE DELETE)
-- Khi xóa product -> tự động xóa requests
ALTER TABLE public.product_allowed_bidders 
  ADD CONSTRAINT product_allowed_bidders_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- ================================================================
-- BƯỚC 3: THÊM FUNCTION TRIGGER ĐỂ LOG KHI XÓA CATEGORY (TÙY CHỌN)
-- ================================================================
CREATE OR REPLACE FUNCTION log_category_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log thông tin category bị xóa (có thể dùng cho audit)
  RAISE NOTICE 'Category deleted: % (id: %)', OLD.name, OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
DROP TRIGGER IF EXISTS before_category_delete ON public.categories;
CREATE TRIGGER before_category_delete
  BEFORE DELETE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION log_category_deletion();

COMMIT;

-- ================================================================
-- HƯỚNG DẪN SỬ DỤNG:
-- ================================================================
-- Sau khi chạy migration này, bạn có thể xóa category bằng:
--
-- DELETE FROM public.categories WHERE id = '<category_id>';
--
-- Hoặc qua API:
-- DELETE /api/admin/categories/:id
--
-- Khi xóa 1 category CHA:
-- ✅ Tự động xóa: category con, products, bids, watchlist, ratings, product_descriptions, product_allowed_bidders
-- ⚠️ Orders vẫn giữ lại (product_id = NULL) để giữ lịch sử giao dịch
--
-- VÍ DỤ: Xóa category "Ma túy"
-- 1. Tìm ID:
--    SELECT id, name, parent_id FROM categories WHERE name LIKE '%Ma túy%';
--
-- 2. Xóa (CASCADE sẽ tự động xóa category con "Ma túy loại nhẹ nhàng"):
--    DELETE FROM categories WHERE name = 'Ma túy' AND parent_id IS NULL;
--
-- 3. Hoặc xóa qua API:
--    DELETE /api/admin/categories/{id}?hard=true
-- ================================================================
