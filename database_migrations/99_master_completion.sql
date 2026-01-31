-- Final Master Data Schema Completion (Based on MASTER_DATA_INVENTORY.md)

-- 1. Enhance Companies Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='legal_name') THEN
        ALTER TABLE companies ADD COLUMN legal_name VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='fy_start_month') THEN
        ALTER TABLE companies ADD COLUMN fy_start_month INTEGER DEFAULT 4;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='fy_end_month') THEN
        ALTER TABLE companies ADD COLUMN fy_end_month INTEGER DEFAULT 3;
    END IF;
END $$;

-- 2. Enhance Customers Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='opening_balance') THEN
        ALTER TABLE customers ADD COLUMN opening_balance DECIMAL(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='opening_balance_date') THEN
        ALTER TABLE customers ADD COLUMN opening_balance_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='default_terms_id') THEN
        ALTER TABLE customers ADD COLUMN default_terms_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='material_code_prefix') THEN
        ALTER TABLE customers ADD COLUMN material_code_prefix VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='payment_terms') THEN
        ALTER TABLE customers ADD COLUMN payment_terms VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='delivery_terms') THEN
        ALTER TABLE customers ADD COLUMN delivery_terms VARCHAR(200);
    END IF;
END $$;

-- 3. Enhance Vendors Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='vendor_code') THEN
        ALTER TABLE vendors ADD COLUMN vendor_code VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='contact_person') THEN
        ALTER TABLE vendors ADD COLUMN contact_person VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='payment_terms') THEN
        ALTER TABLE vendors ADD COLUMN payment_terms VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='delivery_lead_time') THEN
        ALTER TABLE vendors ADD COLUMN delivery_lead_time INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='quality_rating') THEN
        ALTER TABLE vendors ADD COLUMN quality_rating DECIMAL(3,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='vendor_category') THEN
        ALTER TABLE vendors ADD COLUMN vendor_category VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='opening_balance') THEN
        ALTER TABLE vendors ADD COLUMN opening_balance DECIMAL(15,2) DEFAULT 0;
    END IF;
END $$;

-- 4. Enhance Products Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='weight_per_unit') THEN
        ALTER TABLE products ADD COLUMN weight_per_unit DECIMAL(15,4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='material_grade') THEN
        ALTER TABLE products ADD COLUMN material_grade VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='standard') THEN
        ALTER TABLE products ADD COLUMN standard VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='manufacturer') THEN
        ALTER TABLE products ADD COLUMN manufacturer VARCHAR(200);
    END IF;
END $$;

-- 5. Terms & Conditions Table (Standardization)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_conditions' AND column_name='content') THEN
        ALTER TABLE terms_conditions RENAME COLUMN content TO description;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_conditions' AND column_name='description') THEN
        ALTER TABLE terms_conditions ADD COLUMN description TEXT;
    END IF;

    -- Also add default_text to support the current broken API
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_conditions' AND column_name='default_text') THEN
        ALTER TABLE terms_conditions ADD COLUMN default_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='terms_conditions' AND column_name='company_id') THEN
        ALTER TABLE terms_conditions ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;

-- 6. Inspection Agency Master (Supporting)
CREATE TABLE IF NOT EXISTS inspection_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name VARCHAR(200) NOT NULL,
    agency_code VARCHAR(50),
    contact_person VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Seed Standard Terms
-- We'll use DO block to seed to handle both description and default_text
DO $$
BEGIN
    INSERT INTO terms_conditions (category, title, description, default_text, is_default) VALUES
    ('PAYMENT', 'Payment Terms', '100% advance against PI', '100% advance against PI', true),
    ('DELIVERY', 'Delivery Terms', 'Ex-Works Mumbai', 'Ex-Works Mumbai', true),
    ('VALIDITY', 'Offer Validity', '15 days from date of issue', '15 days from date of issue', true),
    ('INSPECTION', 'Inspection', 'Third party inspection at buyer cost', 'Third party inspection at buyer cost', true),
    ('WARRANTY', 'Warranty', 'Mill warranty only', 'Mill warranty only', true),
    ('GST', 'GST', 'GST extra as applicable (18%)', 'GST extra as applicable (18%)', true),
    ('PACKAGING', 'Packaging', 'Standard export packing', 'Standard export packing', true),
    ('FREIGHT', 'Freight', 'Freight extra as applicable', 'Freight extra as applicable', true)
    ON CONFLICT DO NOTHING;
END $$;

-- 8. Seed Inspection Agencies
INSERT INTO inspection_agencies (agency_name, agency_code, email) VALUES
('Bureau Veritas Inspection Services', 'BVIS', 'contact@bvis.com'),
('SGS India Pvt Ltd', 'SGS', 'info@sgs.com'),
('TUV Rheinland India', 'TUV', 'inquiry@tuv.com')
ON CONFLICT DO NOTHING;
