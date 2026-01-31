-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add warehouse_id to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Add warehouse_id to GRN (where the goods were received)
ALTER TABLE grn ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Add warehouse_id to dispatches (from where the goods were shipped)
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Insert a default warehouse
INSERT INTO warehouses (name, code, address, is_active)
VALUES ('Main Warehouse', 'WH01', 'Default Company Warehouse Address', true)
ON CONFLICT (code) DO NOTHING;

-- Update existing inventory to default warehouse
UPDATE inventory SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH01' LIMIT 1) WHERE warehouse_id IS NULL;
