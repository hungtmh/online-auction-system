-- Allow sellers to submit multiple ratings for the same winner on a product
-- This drops the previous uniqueness constraint on (from_user_id, to_user_id, product_id)
-- to keep historical ratings whenever an auction is reopened.

ALTER TABLE ratings
  DROP CONSTRAINT IF EXISTS ratings_from_user_id_to_user_id_product_id_key;
