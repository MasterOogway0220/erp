-- Migration 16: Export Quotation Enhancements

-- 1. Add Export Fields to Quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS port_of_loading_id UUID REFERENCES ports(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS port_of_discharge_id UUID REFERENCES ports(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(255);

-- 2. Quotation Testing Standards (Many-to-Many)
CREATE TABLE IF NOT EXISTS quotation_testing (
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    testing_standard_id UUID REFERENCES testing_standards(id) ON DELETE CASCADE,
    remarks TEXT,
    PRIMARY KEY (quotation_id, testing_standard_id)
);

-- 3. RLS
ALTER TABLE quotation_testing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All access for authenticated" ON quotation_testing FOR ALL USING (auth.role() = 'authenticated');
