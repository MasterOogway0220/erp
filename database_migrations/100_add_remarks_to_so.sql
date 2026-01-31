-- Add remarks column to sales_orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS remarks TEXT;
