-- Reconciliation Migration: Fix missing tables, columns and relationships

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50) NOT NULL CHECK (company_type IN ('Proprietorship', 'Partnership', 'LLP', 'Limited', 'Pvt Ltd', 'HUF')),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    tan VARCHAR(10),
    cin VARCHAR(21),
    email VARCHAR(255),
    website VARCHAR(255),
    telephone VARCHAR(50),
    mobile VARCHAR(50),
    registered_address_line1 TEXT,
    registered_address_line2 TEXT,
    registered_city VARCHAR(100),
    registered_state VARCHAR(100),
    registered_pincode VARCHAR(20),
    registered_country VARCHAR(100) DEFAULT 'India',
    warehouse_address_line1 TEXT,
    warehouse_address_line2 TEXT,
    warehouse_city VARCHAR(100),
    warehouse_state VARCHAR(100),
    warehouse_pincode VARCHAR(20),
    warehouse_country VARCHAR(100) DEFAULT 'India',
    current_financial_year VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT
);

-- 2. Fix Employees Table
DO $$ 
BEGIN
    -- Add columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='first_name') THEN
        ALTER TABLE employees ADD COLUMN first_name VARCHAR(100);
        -- Sync from full_name if it exists
        UPDATE employees SET first_name = split_part(full_name, ' ', 1) WHERE full_name IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='last_name') THEN
        ALTER TABLE employees ADD COLUMN last_name VARCHAR(100);
        UPDATE employees SET last_name = substr(full_name, strpos(full_name, ' ') + 1) WHERE full_name LIKE '% %';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='company_id') THEN
        ALTER TABLE employees ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;

-- 3. Fix Buyers Table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buyers' AND column_name='buyer_name') THEN
        ALTER TABLE buyers RENAME COLUMN buyer_name TO name;
    END IF;
END $$;

-- 4. Fix Products Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='primary_uom_id') THEN
        ALTER TABLE products ADD COLUMN primary_uom_id UUID REFERENCES units_of_measure(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='company_id') THEN
        ALTER TABLE products ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;

-- 5. Add company_id to other tables if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_id') THEN
        ALTER TABLE customers ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='company_id') THEN
        ALTER TABLE vendors ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='company_id') THEN
        ALTER TABLE quotations ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='company_id') THEN
        ALTER TABLE purchase_orders ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
CREATE POLICY "Enable read access for authenticated users" ON companies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON companies;
CREATE POLICY "Enable all access for authenticated users" ON companies FOR ALL TO authenticated USING (true);
