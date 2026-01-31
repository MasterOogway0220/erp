-- Add dimension fields to products for better master data management
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS schedule VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS grade VARCHAR(100);
