-- Phase 5: Sales Order Versioning & Amendments

-- 1. Add versioning columns to sales_orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES sales_orders(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS change_reason TEXT;

-- 2. Add subtotal and tax amounts if missing (for consistency with quotations)
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15, 2) DEFAULT 0;

-- 3. Unique constraint for SO numbering with versioning
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS uq_sales_order_number_company;
ALTER TABLE sales_orders ADD CONSTRAINT uq_sales_order_number_company_version UNIQUE (company_id, order_number, version_number);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_parent ON sales_orders(parent_order_id);
