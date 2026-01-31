-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Link to Supabase Auth User (optional, for login correlation)
    user_id UUID REFERENCES auth.users(id),
    
    -- Link to Company (Multi-entity support)
    company_id UUID REFERENCES companies(id),
    
    -- Basic Details
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    telephone VARCHAR(50),
    
    -- Job Details
    department VARCHAR(50) CHECK (department IN ('Sales', 'Purchase', 'Quality', 'Warehouse', 'Accounts', 'Admin', 'Management')),
    designation VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    avatar_url TEXT
);

-- Search Index
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_company ON employees(company_id);

-- RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON employees
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable write access for admins" ON employees
    FOR ALL
    TO authenticated
    USING (true); -- Ideally restricted to admins
