-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO BIDDING SYSTEM - Database Updates
-- ═══════════════════════════════════════════════════════════════════════════
-- Hệ thống đấu giá tự động - Bidder chỉ cần đặt giá tối đa 1 lần
-- ═══════════════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. CẬP NHẬT BẢNG BIDS - Đã có sẵn max_bid_amount, is_auto_bid
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Bảng bids đã có:
-- - bid_amount: Giá hiện tại vào sản phẩm (visible price)
-- - max_bid_amount: Giá tối đa mà bidder sẵn sàng trả (hidden)
-- - is_auto_bid: TRUE nếu là auto bid
-- - created_at: Thời gian đặt giá (dùng để ưu tiên nếu cùng giá)

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. STORED FUNCTION - XỬ LÝ AUTO BIDDING
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION process_auto_bid(
  p_product_id UUID,
  p_bidder_id UUID,
  p_max_bid DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_current_highest_bid RECORD;
  v_new_bid_amount DECIMAL;
  v_current_winner_id UUID;
  v_current_winner_max_bid DECIMAL;
  v_step_price DECIMAL;
  v_result JSONB;
BEGIN
  -- 1. Lấy thông tin sản phẩm
  SELECT 
    starting_price, 
    step_price, 
    current_price,
    status,
    end_time
  INTO v_product
  FROM products
  WHERE id = p_product_id;

  -- Kiểm tra sản phẩm tồn tại và đang active
  IF v_product IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sản phẩm không tồn tại'
    );
  END IF;

  IF v_product.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sản phẩm không trong trạng thái đấu giá'
    );
  END IF;

  IF v_product.end_time < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Phiên đấu giá đã kết thúc'
    );
  END IF;

  v_step_price := v_product.step_price;

  -- 2. Kiểm tra giá tối đa có hợp lệ không
  IF p_max_bid < v_product.starting_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Giá tối đa phải >= giá khởi điểm'
    );
  END IF;

  -- 3. Tìm bid cao nhất hiện tại (không phải của bidder này)
  SELECT 
    bidder_id,
    max_bid_amount,
    bid_amount
  INTO v_current_highest_bid
  FROM bids
  WHERE product_id = p_product_id
    AND bidder_id != p_bidder_id
    AND is_rejected = false
  ORDER BY max_bid_amount DESC, created_at ASC
  LIMIT 1;

  -- 4. Tính toán giá bid mới
  IF v_current_highest_bid IS NULL THEN
    -- Không có ai bid trước -> đặt giá khởi điểm
    v_new_bid_amount := v_product.starting_price;
  ELSE
    v_current_winner_id := v_current_highest_bid.bidder_id;
    v_current_winner_max_bid := v_current_highest_bid.max_bid_amount;

    -- So sánh max_bid của bidder mới vs bidder hiện tại
    IF p_max_bid > v_current_winner_max_bid THEN
      -- Bidder mới thắng -> giá = max_bid cũ + step
      v_new_bid_amount := v_current_winner_max_bid + v_step_price;
      
      -- Nếu vượt quá max_bid của mình -> chỉ đặt đúng max_bid
      IF v_new_bid_amount > p_max_bid THEN
        v_new_bid_amount := p_max_bid;
      END IF;

    ELSIF p_max_bid = v_current_winner_max_bid THEN
      -- Cùng giá -> người đặt trước thắng (current winner giữ nguyên)
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Giá tối đa của bạn bằng người đấu giá trước. Vui lòng tăng giá cao hơn.',
        'current_price', v_product.current_price,
        'required_min_bid', v_current_winner_max_bid + v_step_price
      );

    ELSE
      -- Bidder mới thua -> max_bid < max_bid hiện tại
      -- Hệ thống tự động tăng giá cho current winner
      v_new_bid_amount := p_max_bid + v_step_price;
      
      -- Nếu vượt quá max_bid của winner -> chỉ đặt đúng max_bid
      IF v_new_bid_amount > v_current_winner_max_bid THEN
        v_new_bid_amount := v_current_winner_max_bid;
      END IF;

      -- Tạo bid tự động cho current winner
      INSERT INTO bids (product_id, bidder_id, bid_amount, max_bid_amount, is_auto_bid)
      VALUES (p_product_id, v_current_winner_id, v_new_bid_amount, v_current_winner_max_bid, true);

      -- Cập nhật current_price của sản phẩm
      UPDATE products
      SET current_price = v_new_bid_amount,
          bid_count = bid_count + 1
      WHERE id = p_product_id;

      RETURN jsonb_build_object(
        'success', false,
        'message', 'Giá tối đa của bạn thấp hơn người đấu giá khác.',
        'current_price', v_new_bid_amount,
        'your_max_bid', p_max_bid,
        'required_min_bid', v_new_bid_amount + v_step_price
      );
    END IF;
  END IF;

  -- 5. Tạo bid mới cho bidder
  INSERT INTO bids (product_id, bidder_id, bid_amount, max_bid_amount, is_auto_bid)
  VALUES (p_product_id, p_bidder_id, v_new_bid_amount, p_max_bid, true);

  -- 6. Cập nhật current_price và bid_count
  UPDATE products
  SET current_price = v_new_bid_amount,
      bid_count = bid_count + 1
  WHERE id = p_product_id;

  -- 7. Trả về kết quả thành công
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Đặt giá tự động thành công!',
    'current_price', v_new_bid_amount,
    'your_max_bid', p_max_bid,
    'is_winning', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Lỗi hệ thống: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_auto_bid IS 'Xử lý đấu giá tự động - tính toán giá bid dựa trên max_bid';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. FUNCTION - LẤY THÔNG TIN NGƯỜI ĐANG THẮNG
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION get_current_winner(p_product_id UUID)
RETURNS TABLE (
  bidder_id UUID,
  bidder_name VARCHAR(255),
  bidder_email VARCHAR(255),
  current_bid DECIMAL,
  max_bid DECIMAL,
  bid_time TIMESTAMP WITH TIME ZONE,
  total_bids BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.bidder_id,
    p.full_name,
    p.email,
    b.bid_amount,
    b.max_bid_amount,
    b.created_at,
    COUNT(*) OVER() as total_bids
  FROM bids b
  JOIN profiles p ON p.id = b.bidder_id
  WHERE b.product_id = p_product_id
    AND b.is_rejected = false
  ORDER BY b.max_bid_amount DESC, b.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_current_winner IS 'Lấy thông tin người đang thắng đấu giá';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. FUNCTION - KIỂM TRA TRẠNG THÁI BID CỦA USER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION get_user_bid_status(
  p_product_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_bid RECORD;
  v_current_winner RECORD;
  v_product RECORD;
  v_is_winning BOOLEAN;
BEGIN
  -- Lấy thông tin sản phẩm
  SELECT current_price, bid_count, step_price
  INTO v_product
  FROM products
  WHERE id = p_product_id;

  -- Lấy bid của user
  SELECT bid_amount, max_bid_amount, created_at
  INTO v_user_bid
  FROM bids
  WHERE product_id = p_product_id
    AND bidder_id = p_user_id
    AND is_rejected = false
  ORDER BY created_at DESC
  LIMIT 1;

  -- Nếu user chưa bid
  IF v_user_bid IS NULL THEN
    RETURN jsonb_build_object(
      'has_bid', false,
      'current_price', v_product.current_price,
      'min_bid_required', COALESCE(v_product.current_price, 0) + v_product.step_price
    );
  END IF;

  -- Kiểm tra xem user có đang thắng không
  SELECT bidder_id
  INTO v_current_winner
  FROM bids
  WHERE product_id = p_product_id
    AND is_rejected = false
  ORDER BY max_bid_amount DESC, created_at ASC
  LIMIT 1;

  v_is_winning := (v_current_winner.bidder_id = p_user_id);

  RETURN jsonb_build_object(
    'has_bid', true,
    'is_winning', v_is_winning,
    'your_max_bid', v_user_bid.max_bid_amount,
    'current_price', v_product.current_price,
    'bid_time', v_user_bid.created_at,
    'total_bids', v_product.bid_count
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_bid_status IS 'Kiểm tra trạng thái bid của user cho sản phẩm';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. CẬP NHẬT TRIGGER - BỎ UPDATE bid_count VÌ ĐÃ XỬ LÝ TRONG FUNCTION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS bid_insert ON bids;
DROP FUNCTION IF EXISTS update_bid_count();

-- Không cần trigger này nữa vì đã xử lý trong process_auto_bid function


-- ═══════════════════════════════════════════════════════════════════════════
-- TEST CASES - VÍ DỤ SỬ DỤNG
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- Ví dụ test với iPhone 11: Starting 10tr, Step 100k

-- Bidder #1 đặt max 11tr
SELECT process_auto_bid(
  'product-uuid-here', 
  'bidder-1-uuid', 
  11000000
);
-- Kết quả: current_price = 10,000,000 (starting price)

-- Bidder #2 đặt max 10.8tr
SELECT process_auto_bid(
  'product-uuid-here', 
  'bidder-2-uuid', 
  10800000
);
-- Kết quả: Bidder #1 tự động bid lên 10,900,000 (10.8tr + 100k)
-- Bidder #2 thua

-- Bidder #3 đặt max 11.5tr  
SELECT process_auto_bid(
  'product-uuid-here', 
  'bidder-3-uuid', 
  11500000
);
-- Kết quả: current_price = 11,100,000 (11tr + 100k)
-- Bidder #3 thắng

-- Bidder #4 đặt max 11.5tr (cùng với #3)
SELECT process_auto_bid(
  'product-uuid-here', 
  'bidder-4-uuid', 
  11500000
);
-- Kết quả: Thất bại - Bidder #3 đặt trước nên thắng

-- Bidder #4 tăng lên 11.7tr
SELECT process_auto_bid(
  'product-uuid-here', 
  'bidder-4-uuid', 
  11700000
);
-- Kết quả: current_price = 11,600,000 (11.5tr + 100k)
-- Bidder #4 thắng
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF AUTO BIDDING SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
