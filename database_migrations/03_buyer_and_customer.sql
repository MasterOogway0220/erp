-- Update Customers Table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_terms_id UUID; -- FK to terms_conditions later
ALTER TABLE customers ADD COLUMN IF NOT EXISTS material_code_settings JSONB; -- Store settings about material codes

-- Create Customer Dispatch Addresses Table
CREATE TABLE IF NOT EXISTS customer_dispatch_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    label VARCHAR(100), -- e.g., "Mumbai Warehouse", "Plant 2"
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gstin VARCHAR(15), -- Dispatch location might have different GSTIN
    
    is_default BOOLEAN DEFAULT false
);

-- Create Buyers Table
CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    email VARCHAR(255),
    mobile VARCHAR(50),
    telephone VARCHAR(50),
    
    is_active BOOLEAN DEFAULT true
);

-- Search Index
CREATE INDEX idx_buyers_customer ON buyers(customer_id);

-- Update Enquiries and Quotations to link to Buyers
-- Note: You might need to add these columns to your existing tables
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);

-- RLS
ALTER TABLE customer_dispatch_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON customer_dispatch_addresses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON customer_dispatch_addresses FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON buyers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON buyers FOR ALL TO authenticated USING (true);
