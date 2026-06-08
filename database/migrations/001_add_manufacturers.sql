USE inventory_portal;

CREATE TABLE IF NOT EXISTS manufacturers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_manufacturers_name (name)
) ENGINE=InnoDB;

INSERT INTO manufacturers (name)
VALUES ('ABC'), ('BCD'), ('CDE'), ('DEF'), ('EFI')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Run this only once on an existing database that does not yet have manufacturer_id.
ALTER TABLE products
  ADD COLUMN manufacturer_id BIGINT UNSIGNED NULL AFTER id,
  ADD KEY idx_products_manufacturer (manufacturer_id),
  ADD CONSTRAINT fk_products_manufacturer
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
    ON DELETE SET NULL;

UPDATE products
SET manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'ABC' LIMIT 1)
WHERE manufacturer_id IS NULL;
