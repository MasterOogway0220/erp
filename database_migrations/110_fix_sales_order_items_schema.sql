-- Comprehensive Fix for Sales Order and Items Schema
-- Ensured all columns used in Sales Orders and their items exist.

-- 1. Fix sales_orders Table
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES sales_orders(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS change_reason TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);

-- 2. Fix sales_order_items Table
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS product_spec_id UUID REFERENCES product_specifications(id);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS pipe_size_id UUID REFERENCES pipe_sizes(id);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS schedule VARCHAR(50);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS weight_per_mtr DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS total_weight DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS auto_calculated_weight DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS grade VARCHAR(50);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Fix quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
