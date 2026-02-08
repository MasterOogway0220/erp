-- Phase 6: Quality Control & ISO Compliance Enhancements

-- 1. Enhance inspections table with Heat Number for direct traceability
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS heat_number VARCHAR(100);

-- 2. Create detailed test results table for the 12 test types
CREATE TABLE IF NOT EXISTS inspection_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    test_standard_id UUID REFERENCES testing_standards(id),
    parameter_name VARCHAR(100) NOT NULL,
    specification TEXT,
    actual_value TEXT,
    result VARCHAR(10) CHECK (result IN ('pass', 'fail')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_insp ON inspection_test_results(inspection_id);

-- 3. Create MTC (Mill Test Certificate) documents repository
CREATE TABLE IF NOT EXISTS mtc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_number VARCHAR(100) UNIQUE NOT NULL,
    file_url TEXT NOT NULL,
    issuer VARCHAR(200),
    issue_date DATE,
    raw_data JSONB, -- For extracted composition/properties
    company_id UUID REFERENCES companies(id),
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mtc_heat_number ON mtc_documents(heat_number);

-- 4. Link inventory items to MTC
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS mtc_id UUID REFERENCES mtc_documents(id);

-- 5. Enhance NCR table with Root Cause Analysis fields (ISO 8.7, 10.2)
ALTER TABLE ncr 
ADD COLUMN IF NOT EXISTS root_cause TEXT,
ADD COLUMN IF NOT EXISTS rca_method VARCHAR(50), -- '5-Why', 'Fishbone', 'Other'
ADD COLUMN IF NOT EXISTS corrective_action TEXT,
ADD COLUMN IF NOT EXISTS preventive_action TEXT,
ADD COLUMN IF NOT EXISTS responsible_person_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS target_closure_date DATE,
ADD COLUMN IF NOT EXISTS effectiveness_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS effectiveness_verified_by UUID REFERENCES auth.users(id);

-- 6. Add RLS for new tables
ALTER TABLE inspection_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON inspection_test_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON inspection_test_results FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON mtc_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON mtc_documents FOR INSERT TO authenticated WITH CHECK (true);
