-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Details
    name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50) NOT NULL CHECK (company_type IN ('Proprietorship', 'Partnership', 'LLP', 'Limited', 'Pvt Ltd', 'HUF')),
    
    -- Legal Identifiers
    gstin VARCHAR(15),
    pan VARCHAR(10),
    tan VARCHAR(10),
    cin VARCHAR(21),
    
    -- Contact Details
    email VARCHAR(255),
    website VARCHAR(255),
    telephone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Registered Address
    registered_address_line1 TEXT,
    registered_address_line2 TEXT,
    registered_city VARCHAR(100),
    registered_state VARCHAR(100),
    registered_pincode VARCHAR(20),
    registered_country VARCHAR(100) DEFAULT 'India',
    
    -- Warehouse Address
    warehouse_address_line1 TEXT,
    warehouse_address_line2 TEXT,
    warehouse_city VARCHAR(100),
    warehouse_state VARCHAR(100),
    warehouse_pincode VARCHAR(20),
    warehouse_country VARCHAR(100) DEFAULT 'India',
    
    -- Financial Year Settings
    current_financial_year VARCHAR(20), -- e.g., '2025-2026'
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT
);

-- Search Index
CREATE INDEX idx_companies_name ON companies(name);

-- RLS Policies (Assuming authenticated users can read/write for now, to be refined later)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON companies
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON companies
    FOR UPDATE
    TO authenticated
    USING (true);
