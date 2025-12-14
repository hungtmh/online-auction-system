-- ============================================
-- MIGRATION: Order Completion Flow 4 Steps
-- Date: 2025-12-13
-- ============================================

-- Cập nhật order_status enum để hỗ trợ flow 4 bước rõ ràng hơn
-- Các bước:
-- 1. pending_payment - Buyer cung cấp hoá đơn + địa chỉ
-- 2. payment_confirmed - Seller xác nhận đã nhận tiền
-- 3. shipped - Seller gửi hoá đơn vận chuyển
-- 4. delivered - Buyer xác nhận đã nhận hàng
-- 5. completed - Cả 2 đã đánh giá (hoặc auto complete sau X ngày)
-- 6. cancelled - Đã huỷ

-- Thêm các trường mới cho orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Thêm trường để track đánh giá
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_rated BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_rated BOOLEAN DEFAULT false;

-- Index cho order_chat
CREATE INDEX IF NOT EXISTS idx_order_chat_sender ON order_chat(sender_id);

-- Comment
COMMENT ON COLUMN orders.shipping_proof_url IS 'Ảnh hoá đơn vận chuyển từ seller';
COMMENT ON COLUMN orders.buyer_confirmed_at IS 'Thời điểm buyer xác nhận đã nhận hàng';
COMMENT ON COLUMN orders.seller_rated IS 'Seller đã đánh giá buyer chưa';
COMMENT ON COLUMN orders.buyer_rated IS 'Buyer đã đánh giá seller chưa';

-- ============================================
-- HƯỚNG DẪN CHẠY:
-- 1. Mở Supabase Dashboard > SQL Editor
-- 2. Paste và chạy script này
-- ============================================
