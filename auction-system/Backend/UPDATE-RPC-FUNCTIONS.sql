-- =====================================================
-- CẬP NHẬT RPC FUNCTIONS ĐỂ TRẢ VỀ ĐẦY ĐỦ THÔNG TIN
-- =====================================================
-- Chạy file này trong Supabase SQL Editor để update functions

-- Bước 1: DROP function cũ (vì không thể thay đổi return type với CREATE OR REPLACE)
DROP FUNCTION IF EXISTS get_top_most_bids(INTEGER);

-- Bước 2: Tạo lại function với return type mới
CREATE FUNCTION get_top_most_bids(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(500),
  current_price DECIMAL,
  starting_price DECIMAL,
  bid_count INTEGER,
  thumbnail_url TEXT,
  seller_id UUID,
  category_id UUID,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.current_price,
    p.starting_price,
    p.bid_count,
    p.thumbnail_url,
    p.seller_id,
    p.category_id,
    p.end_time,
    p.created_at
  FROM products p
  WHERE p.status = 'active'
  ORDER BY p.bid_count DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Bước 3: Verify function hoạt động
SELECT * FROM get_top_most_bids(5);
