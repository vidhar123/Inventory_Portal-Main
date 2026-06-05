CREATE DATABASE IF NOT EXISTS inventory_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventory_portal;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NULL,
  selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  reorder_level INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('active', 'draft', 'archived') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category),
  KEY idx_products_status (status),
  KEY idx_products_stock (quantity, reorder_level)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_images_object_key (object_key),
  KEY idx_product_images_product_sort (product_id, sort_order),
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Optional sample data. Run this block only if you want initial products.
INSERT INTO products
  (name, sku, category, description, selling_price, unit_cost, quantity, reorder_level, status)
VALUES
  ('Aurora Wireless Headphones', 'ELEC-AWH-01', 'Electronics', 'Over-ear noise cancelling headphones with 40h battery life and USB-C fast charging.', 149.99, 82.00, 132, 25, 'active'),
  ('Terra Stainless Water Bottle', 'HOME-TSB-22', 'Home & Kitchen', 'Insulated 750ml bottle keeping drinks cold for 24h and hot for 12h.', 24.50, 9.75, 18, 30, 'active'),
  ('Vertex Running Shoes', 'SPRT-VRS-09', 'Sports', 'Lightweight breathable mesh runners with responsive foam midsole.', 89.00, 41.20, 0, 15, 'active'),
  ('Lumen Desk Lamp', 'OFFC-LDL-14', 'Office', 'Dimmable LED desk lamp with wireless charging base and 3 color modes.', 59.99, 27.50, 64, 20, 'active'),
  ('Cloud Cotton T-Shirt', 'APRL-CCT-07', 'Apparel', 'Premium combed cotton crew-neck tee, pre-shrunk and tagless.', 19.99, 6.40, 240, 50, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  selling_price = VALUES(selling_price),
  unit_cost = VALUES(unit_cost),
  quantity = VALUES(quantity),
  reorder_level = VALUES(reorder_level),
  status = VALUES(status);
