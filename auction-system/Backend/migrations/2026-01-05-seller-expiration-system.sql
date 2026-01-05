-- ============================================
-- SELLER EXPIRATION SYSTEM
-- ============================================
-- Thêm cột seller_expired_at và tạo bảng lịch sử gia hạn
-- Date: 2026-01-05

-- 1. Thêm cột seller_expired_at vào bảng profiles
ALTER TABLE profiles
ADD COLUMN seller_expired_at TIMESTAMP WITH TIME ZONE;

-- 2. Tạo bảng SellerExtensionHistory
CREATE TABLE seller_extension_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  extended_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin ID
  previous_expired_at TIMESTAMP WITH TIME ZONE,
  new_expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
  extension_days INTEGER NOT NULL DEFAULT 7,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index để tăng tốc query
CREATE INDEX idx_seller_extension_history_seller_id ON seller_extension_history(seller_id);
CREATE INDEX idx_seller_extension_history_created_at ON seller_extension_history(created_at DESC);

-- 3. Tạo trigger function để tự động update seller_expired_at
CREATE OR REPLACE FUNCTION update_seller_expired_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Update seller_expired_at trong profiles
  UPDATE profiles
  SET seller_expired_at = NEW.new_expired_at
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Gắn trigger vào bảng seller_extension_history
CREATE TRIGGER trg_update_seller_expired_at
AFTER INSERT ON seller_extension_history
FOR EACH ROW
EXECUTE FUNCTION update_seller_expired_at();

-- 5. Set seller_expired_at = NOW() cho tất cả seller hiện tại
UPDATE profiles
SET seller_expired_at = NOW()
WHERE role = 'seller';

-- 6. Comment cho documentation
COMMENT ON COLUMN profiles.seller_expired_at IS 'Thời điểm hết hạn quyền seller. Nếu NULL hoặc quá hạn, seller không thể tạo sản phẩm mới.';
COMMENT ON TABLE seller_extension_history IS 'Lịch sử gia hạn quyền seller. Mỗi lần insert sẽ tự động update profiles.seller_expired_at qua trigger.';

-- ============================================
-- Test queries (optional)
-- ============================================

-- Xem các seller sắp hết hạn (trong 3 ngày tới)
-- SELECT id, full_name, email, seller_expired_at 
-- FROM profiles 
-- WHERE role = 'seller' 
--   AND seller_expired_at IS NOT NULL 
--   AND seller_expired_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
-- ORDER BY seller_expired_at ASC;

-- Xem lịch sử gia hạn của 1 seller
-- SELECT seh.*, 
--        p_admin.full_name as admin_name
-- FROM seller_extension_history seh
-- LEFT JOIN profiles p_admin ON seh.extended_by = p_admin.id
-- WHERE seh.seller_id = 'YOUR_SELLER_ID'
-- ORDER BY seh.created_at DESC;
