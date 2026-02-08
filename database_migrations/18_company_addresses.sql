-- Create company_addresses table
CREATE TABLE IF NOT EXISTS company_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    address_type TEXT NOT NULL CHECK (address_type IN ('Registered', 'Branch', 'Warehouse', 'Billing')),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT NOT NULL,
    gstin TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for company_id
CREATE INDEX IF NOT EXISTS idx_company_addresses_company_id ON company_addresses(company_id);

-- Add RLS policies
ALTER TABLE company_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON company_addresses
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON company_addresses
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON company_addresses
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
