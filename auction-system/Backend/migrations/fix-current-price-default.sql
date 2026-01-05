-- Sửa lỗi current_price mặc định là 0 trong bảng products
-- Date: 2026-01-05
-- Issue: current_price has DEFAULT 0, causing new products to have current_price = 0 instead of starting_price

UPDATE products 
SET current_price = starting_price 
WHERE current_price = 0 
   OR current_price IS NULL 
   OR current_price < starting_price;

ALTER TABLE products 
ALTER COLUMN current_price DROP DEFAULT;

