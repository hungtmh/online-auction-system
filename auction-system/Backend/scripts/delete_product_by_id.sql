-- ============================================
-- SCRIPT XÓA SẢN PHẨM THEO ID
-- ============================================
-- Script này xóa sản phẩm và tất cả dữ liệu liên quan
-- Thứ tự xóa: Xóa bảng con trước, sau đó mới xóa products
-- 
-- CÁCH SỬ DỤNG:
-- 1. Thay thế 'YOUR_PRODUCT_ID_HERE' bằng ID sản phẩm cần xóa
-- 2. Chạy script trong Supabase SQL Editor hoặc pgAdmin
-- ============================================

-- Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
BEGIN;

-- Biến để lưu product_id (THAY ĐỔI GIÁ TRỊ NÀY)
DO $$
DECLARE
  target_product_id UUID := 'YOUR_PRODUCT_ID_HERE'::UUID;
  deleted_orders UUID[];
BEGIN
  -- In thông tin sản phẩm trước khi xóa
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bắt đầu xóa sản phẩm ID: %', target_product_id;
  RAISE NOTICE '========================================';

  -- 1. Xóa order_chat (thông qua orders)
  RAISE NOTICE 'Bước 1: Xóa order_chat...';
  DELETE FROM public.order_chat
  WHERE order_id IN (
    SELECT id FROM public.orders WHERE product_id = target_product_id
  );
  RAISE NOTICE '✓ Đã xóa % dòng từ order_chat', FOUND;

  -- 2. Xóa orders
  RAISE NOTICE 'Bước 2: Xóa orders...';
  DELETE FROM public.orders
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ orders', FOUND;

  -- 3. Xóa spam_reports liên quan đến sản phẩm
  RAISE NOTICE 'Bước 3: Xóa spam_reports...';
  DELETE FROM public.spam_reports
  WHERE reported_product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ spam_reports', FOUND;

  -- 4. Xóa spam_reports liên quan đến bids của sản phẩm
  RAISE NOTICE 'Bước 4: Xóa spam_reports (liên quan bids)...';
  DELETE FROM public.spam_reports
  WHERE reported_bid_id IN (
    SELECT id FROM public.bids WHERE product_id = target_product_id
  );
  RAISE NOTICE '✓ Đã xóa % dòng từ spam_reports (bids)', FOUND;

  -- 5. Xóa ratings liên quan đến sản phẩm
  RAISE NOTICE 'Bước 5: Xóa ratings...';
  DELETE FROM public.ratings
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ ratings', FOUND;

  -- 6. Xóa rejected_bidders
  RAISE NOTICE 'Bước 6: Xóa rejected_bidders...';
  DELETE FROM public.rejected_bidders
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ rejected_bidders', FOUND;

  -- 7. Xóa product_allowed_bidders
  RAISE NOTICE 'Bước 7: Xóa product_allowed_bidders...';
  DELETE FROM public.product_allowed_bidders
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ product_allowed_bidders', FOUND;

  -- 8. Xóa questions
  RAISE NOTICE 'Bước 8: Xóa questions...';
  DELETE FROM public.questions
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ questions', FOUND;

  -- 9. Xóa watchlist
  RAISE NOTICE 'Bước 9: Xóa watchlist...';
  DELETE FROM public.watchlist
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ watchlist', FOUND;

  -- 10. Xóa product_descriptions
  RAISE NOTICE 'Bước 10: Xóa product_descriptions...';
  DELETE FROM public.product_descriptions
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ product_descriptions', FOUND;

  -- 11. Xóa bids
  RAISE NOTICE 'Bước 11: Xóa bids...';
  DELETE FROM public.bids
  WHERE product_id = target_product_id;
  RAISE NOTICE '✓ Đã xóa % dòng từ bids', FOUND;

  -- 12. Cuối cùng, xóa product
  RAISE NOTICE 'Bước 12: Xóa products...';
  DELETE FROM public.products
  WHERE id = target_product_id;
  
  IF FOUND THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ĐÃ XÓA THÀNH CÔNG SẢN PHẨM ID: %', target_product_id;
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠ KHÔNG TÌM THẤY SẢN PHẨM ID: %', target_product_id;
    RAISE NOTICE '========================================';
  END IF;

END $$;

-- Commit transaction
COMMIT;

-- ============================================
-- LƯU Ý:
-- ============================================
-- 1. Script này sẽ XÓA VĨNH VIỄN dữ liệu, không thể khôi phục
-- 2. Nên backup database trước khi chạy
-- 3. Nếu có CASCADE DELETE constraints trong database, 
--    một số bảng có thể tự động xóa
-- 4. Để xóa nhiều sản phẩm, chạy script nhiều lần 
--    với các ID khác nhau
-- ============================================

-- ============================================
-- VÍ DỤ XÓA NHIỀU SẢN PHẨM:
-- ============================================
-- BEGIN;
-- 
-- DO $$
-- DECLARE
--   product_ids UUID[] := ARRAY[
--     'id-san-pham-1'::UUID,
--     'id-san-pham-2'::UUID,
--     'id-san-pham-3'::UUID
--   ];
--   target_id UUID;
-- BEGIN
--   FOREACH target_id IN ARRAY product_ids
--   LOOP
--     -- Thực hiện các bước xóa như trên cho mỗi target_id
--     -- ... (copy code xóa từ trên vào đây)
--   END LOOP;
-- END $$;
-- 
-- COMMIT;
-- ============================================
