-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION: Xóa status 'active' khỏi product_status enum
-- Chuyển tất cả products có status = 'active' thành 'approved'
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Bước 1: Migrate dữ liệu - Chuyển tất cả 'active' thành 'approved'
UPDATE products 
SET status = 'approved'::product_status
WHERE status = 'active'::product_status;

-- Bước 2: Xóa 'active' khỏi enum (PostgreSQL 12+)
-- Lưu ý: Không thể xóa trực tiếp enum value nếu đang được sử dụng
-- Cần tạo enum mới và migrate

-- Tạo enum mới không có 'active'
DO $$ 
BEGIN
    -- Tạo enum mới
    CREATE TYPE product_status_new AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
    
    -- Thay đổi column type
    ALTER TABLE products 
    ALTER COLUMN status TYPE product_status_new 
    USING status::text::product_status_new;
    
    -- Xóa enum cũ
    DROP TYPE product_status;
    
    -- Đổi tên enum mới thành tên cũ
    ALTER TYPE product_status_new RENAME TO product_status;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Kiểm tra kết quả
SELECT status, COUNT(*) 
FROM products 
GROUP BY status 
ORDER BY status;

