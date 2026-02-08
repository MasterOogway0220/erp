-- Part 4: Definitive Fix for Sales Orders and Items
-- SOLVES: "Could not find the 'billing_address' column of 'sales_orders' in the schema cache"
-- ALSO FIXES: Missing order_number, shipping_address, and item-level totals.

-- 1. Fix sales_orders Table
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_po_date DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_terms TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;

-- 2. Fix sales_order_items Table
-- The API uses 'total_amount' and 'uom' (string), but my previous fix added 'line_total' and 'uom_id'.
-- Adding both to support legacy/current API code.
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS uom VARCHAR(20);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS hsn_code_text TEXT; -- Supporting both names just in case
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id); -- Ensure product_id exists if missing
