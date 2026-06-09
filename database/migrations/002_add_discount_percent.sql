USE inventory_portal;

ALTER TABLE products
  ADD COLUMN discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00 AFTER selling_price;
