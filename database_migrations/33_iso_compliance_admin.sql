-- Phase 12: Admin & ISO Compliance

-- 1. Create Audit Logs table for ISO traceability (KP-11)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON audit_logs
    FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 2. Enhance Warehouses with GSTIN support (KP-3)
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS gstin TEXT;

-- 3. Enhance Company Addresses with active status
ALTER TABLE company_addresses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Function to get financial year based on date
CREATE OR REPLACE FUNCTION get_financial_year(p_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM p_date);
    v_month := EXTRACT(MONTH FROM p_date);
    
    -- In India, FY starts in April (4)
    IF v_month >= 4 THEN
        RETURN v_year::TEXT || '-' || (v_year + 1)::TEXT;
    ELSE
        RETURN (v_year - 1)::TEXT || '-' || v_year::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE audit_logs IS 'ISO 9001:2018 Traceability: Detailed log of all system mutations';
COMMENT ON COLUMN warehouses.gstin IS 'State-specific GSTIN for multi-warehouse operations';
