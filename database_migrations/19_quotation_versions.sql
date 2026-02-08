-- Create quotation_versions table
CREATE TABLE IF NOT EXISTS quotation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id),
    version_number INTEGER NOT NULL,
    quotation_number TEXT NOT NULL, -- e.g., NPS/25/14408 Rev.01
    
    -- Snapshot of all quotation fields at the time of revision
    customer_id UUID NOT NULL REFERENCES customers(id),
    buyer_id UUID NOT NULL REFERENCES buyers(id),
    company_address_id UUID REFERENCES company_addresses(id), -- Specific address used
    
    currency TEXT NOT NULL,
    exchange_rate NUMERIC DEFAULT 1,
    valid_until TIMESTAMP WITH TIME ZONE,
    payment_terms TEXT,
    delivery_terms TEXT,
    
    subtotal NUMERIC NOT NULL,
    tax_amount NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    
    -- Change Tracking
    change_log JSONB, -- specific field changes
    reason_for_change TEXT,
    created_by UUID REFERENCES auth.users(id), -- implied linkage to auth.users if using supabase auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for looking up versions of a quotation
CREATE INDEX IF NOT EXISTS idx_quotation_versions_quotation_id ON quotation_versions(quotation_id);

-- Add RLS policies
ALTER TABLE quotation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON quotation_versions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON quotation_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
