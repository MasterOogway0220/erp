-- Definitive Fix for Item Tables (Quotation & Sales Order)
-- SOLVES: "Could not find the 'description' column of 'quotation_items' in the schema cache"
-- ALSO FIXES: Missing technical specifications and structural consistency.

-- 1. Fix quotation_items
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS schedule VARCHAR(50);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(15,2);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS weight_per_mtr DECIMAL(15,2);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS total_weight DECIMAL(15,2);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- 2. Fix sales_order_items
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS schedule VARCHAR(50);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS weight_per_mtr DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS total_weight DECIMAL(15,2);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- 3. Fix enquiry_items (Just in case)
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS schedule VARCHAR(50);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(15,2);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS weight_per_mtr DECIMAL(15,2);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS total_weight DECIMAL(15,2);
ALTER TABLE enquiry_items ADD COLUMN IF NOT EXISTS grade VARCHAR(50);
