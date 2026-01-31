-- Migration 15: Master Data Comprehensive

-- 1. Testing Standards
CREATE TABLE IF NOT EXISTS testing_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Currencies
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- USD, EUR, INR
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ports
CREATE TABLE IF NOT EXISTS ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- INNSA, INMUN
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory Enhancements
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS pieces INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS mtc_type VARCHAR(50);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tpi VARCHAR(100);

-- 5. RLS Policies
ALTER TABLE testing_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Testing Standards" ON testing_standards FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Currencies" ON currencies FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Ports" ON ports FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Initial Master Data Seed (Basic)
INSERT INTO currencies (code, name, symbol) VALUES
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('INR', 'Indian Rupee', '₹'),
('AED', 'UAE Dirham', 'د.إ')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ports (code, name, city, country) VALUES
('INNSA', 'Nhava Sheva', 'Mumbai', 'India'),
('INMUN', 'Mundra Port', 'Mundra', 'India'),
('INHZA', 'Hazira Port', 'Surat', 'India')
ON CONFLICT (code) DO NOTHING;
