-- Product Code Enhancements
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_material_code VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS customer_material_code VARCHAR(100); -- Simplistic logic per Gap Analysis
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_code_sequence INTEGER;

-- Unique constraint on internal code per company (if company_id exists) or globally
ALTER TABLE products ADD CONSTRAINT products_internal_code_key UNIQUE (internal_material_code);

-- Units of Measure
CREATE TABLE IF NOT EXISTS units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL, -- 'KG', 'MTR', etc.
  name VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50) NOT NULL, -- 'WEIGHT', 'LENGTH', 'QUANTITY'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed UOM Data
INSERT INTO units_of_measure (code, name, unit_type) VALUES
('KG', 'Kilogram', 'WEIGHT'),
('PC', 'Piece', 'QUANTITY'),
('NO', 'Number', 'QUANTITY'),
('MTR', 'Meter', 'LENGTH'),
('FT', 'Feet', 'LENGTH'),
('MM', 'Millimeter', 'LENGTH'),
('IN', 'Inch', 'LENGTH')
ON CONFLICT (code) DO NOTHING;

-- Link Products to UOM
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_uom_id UUID REFERENCES units_of_measure(id);

-- Link Quotation/Order Items to UOM
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);
-- Also likely needed for other Item tables, but starting with Quotations as per Phase 2
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS uom_id UUID REFERENCES units_of_measure(id);

-- Pipe Size Master
CREATE TABLE IF NOT EXISTS pipe_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type VARCHAR(10), -- 'CS', 'SS', 'AS', 'DS'
  size_inch VARCHAR(20),
  od_mm DECIMAL(10,2),
  schedule VARCHAR(20),
  wall_thickness_mm DECIMAL(10,3),
  weight_kg_per_m DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Specifications Master (for dropdowns)
CREATE TABLE IF NOT EXISTS product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(200),
  material VARCHAR(200),
  additional_spec VARCHAR(500),
  ends VARCHAR(50),
  length_range VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing History (as requested in 2.5)
CREATE TABLE IF NOT EXISTS product_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  quotation_id UUID REFERENCES quotations(id),
  customer_id UUID REFERENCES customers(id),
  quoted_price DECIMAL(15,2),
  quoted_date DATE DEFAULT CURRENT_DATE,
  order_received BOOLEAN DEFAULT false,
  sales_order_id UUID REFERENCES sales_orders(id),
  company_id UUID REFERENCES companies(id)
);

-- RLS
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read UOM" ON units_of_measure FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE pipe_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Pipe Sizes" ON pipe_sizes FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Specs" ON product_specifications FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE product_pricing_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read History" ON product_pricing_history FOR SELECT USING (auth.role() = 'authenticated');
