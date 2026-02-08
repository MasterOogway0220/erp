-- Phase 4: Inventory Management Enhancements

-- 1. Add reserved_quantity to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_quantity DECIMAL(15, 3) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available_quantity DECIMAL(15, 3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED;

-- 2. Add min_stock_level to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level DECIMAL(15, 3) DEFAULT 0;

-- 3. Create Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'GRN', 'DISPATCH', 'RETURN', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_CANCEL'
    quantity DECIMAL(15, 3) NOT NULL,
    reference_id UUID, -- ID of GRN, Dispatch, or SO
    reference_type VARCHAR(50), -- 'GRN', 'DISPATCH', 'SALES_ORDER'
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. RLS for Transactions
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of their company" ON inventory_transactions
    FOR SELECT USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can insert transactions for their company" ON inventory_transactions
    FOR INSERT WITH CHECK (company_id::text = current_setting('app.current_company_id', true));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_inv_transactions_item ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inv_transactions_ref ON inventory_transactions(reference_id);
