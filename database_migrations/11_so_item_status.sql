-- Migration to add item-level status to Sales Orders
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS production_status TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS qc_status TEXT;

-- Update existing items to 'pending' if they are null
UPDATE sales_order_items SET status = 'pending' WHERE status IS NULL;

-- Possible status values: 'pending', 'material_reserved', 'production', 'qc_passed', 'ready_for_dispatch', 'dispatched'
