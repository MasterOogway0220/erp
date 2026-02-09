-- Migration 22: Company Bank Details
-- To support professional quotations with specific bank instructions

CREATE TABLE IF NOT EXISTS company_bank_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_no TEXT NOT NULL,
    ifsc_code TEXT,
    swift_code TEXT,
    branch_name TEXT,
    account_type TEXT, -- e.g., Current, Savings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE company_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON company_bank_details
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON company_bank_details
    FOR ALL TO authenticated USING (true);
