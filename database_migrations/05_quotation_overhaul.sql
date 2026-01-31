-- Quotation Versioning and Types
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS parent_quotation_id UUID REFERENCES quotations(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quotation_type VARCHAR(50) DEFAULT 'STANDARD'; -- 'STANDARD', 'NON_STANDARD'
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);

-- Terms & Conditions Master
CREATE TABLE IF NOT EXISTS terms_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'PAYMENT', 'DELIVERY', 'WARRANTY', 'VALIDITY', 'PACKING', 'INSPECTION'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  product_category VARCHAR(100), -- Optional: 'PIPES', 'FITTINGS', etc.
  is_active BOOLEAN DEFAULT true,
  company_id UUID REFERENCES companies(id), -- Multi-company support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Quotation Terms Linkage (Many-to-Many with custom text)
CREATE TABLE IF NOT EXISTS quotation_terms (
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  terms_id UUID REFERENCES terms_conditions(id),
  custom_text TEXT, -- Allow editing text per quotation
  display_order INTEGER,
  PRIMARY KEY (quotation_id, terms_id)
);

-- RLS Policies for Terms
ALTER TABLE terms_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON terms_conditions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for admin/sales" ON terms_conditions
    FOR ALL USING (auth.role() = 'authenticated'); -- Refine roles later

-- RLS for Quotation Terms
ALTER TABLE quotation_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON quotation_terms
    FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_parent_id ON quotations(parent_quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotations_buyer_id ON quotations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_terms_company ON terms_conditions(company_id);
