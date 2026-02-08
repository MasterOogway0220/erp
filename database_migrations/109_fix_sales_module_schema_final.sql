-- Comprehensive Fix for Sales Module Schema Inconsistencies
-- Created to solve all "missing column" errors at once.

-- 1. Fix Enquiries Table
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- 2. Fix Quotations Table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS parent_quotation_id UUID REFERENCES quotations(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quotation_type VARCHAR(50) DEFAULT 'STANDARD';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);

-- Ensure all charges exist
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS packing_charges DECIMAL(15,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS freight_charges DECIMAL(15,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS other_charges DECIMAL(15,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS total_weight DECIMAL(15,2) DEFAULT 0;

-- Ensure export fields exist
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS port_of_loading_id UUID REFERENCES ports(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS port_of_discharge_id UUID REFERENCES ports(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(255);

-- 3. Fix Quotation Items Table
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS line_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS description_text TEXT;

-- 4. Fix sales_orders Table
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES sales_orders(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS change_reason TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 0;
