-- Phase 10: Dispatch & Invoicing (ISO 9001:2018 Compliance)

-- 1. Dispatches Header Table
CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id) NOT NULL,
    
    dispatch_number VARCHAR(50) NOT NULL, -- Format: DSP/24-25/001
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    vehicle_number VARCHAR(100),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    lr_number VARCHAR(100), -- Lorry Receipt
    eway_bill_number VARCHAR(100),
    
    consignee_address JSONB, -- From SO / Dispatch Address Master
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, dispatched, delivered, cancelled
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT uq_dispatch_number_company UNIQUE (company_id, dispatch_number)
);

-- 2. Dispatch Items Table
CREATE TABLE IF NOT EXISTS dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales_order_items(id),
    product_id UUID REFERENCES products(id),
    inventory_id UUID REFERENCES inventory(id),
    
    quantity DECIMAL(12, 3) NOT NULL,
    heat_number VARCHAR(100),
    packaging_details TEXT,
    net_weight DECIMAL(12, 3),
    gross_weight DECIMAL(12, 3),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invoices Header Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    dispatch_id UUID REFERENCES dispatches(id) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id) NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    
    invoice_number VARCHAR(50) NOT NULL, -- Format: INV/24-25/001
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    currency VARCHAR(10) DEFAULT 'INR',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    cgst DECIMAL(15, 2) NOT NULL DEFAULT 0,
    sgst DECIMAL(15, 2) NOT NULL DEFAULT 0,
    igst DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    
    billing_address JSONB,
    shipping_address JSONB,
    place_of_supply VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, partial_paid, paid, overdue, cancelled
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT uq_invoice_number_company UNIQUE (company_id, invoice_number)
);

-- 4. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales_order_items(id),
    product_id UUID REFERENCES products(id),
    
    description TEXT,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    hsn_code VARCHAR(20),
    heat_number VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payment Receipts Table
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    
    receipt_number VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    amount DECIMAL(15, 2) NOT NULL,
    payment_mode VARCHAR(50), -- cash, cheque, neft, rtgs, upi, wire
    reference_number VARCHAR(100), -- Cheque No / UTR
    bank_details TEXT,
    
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT uq_receipt_number_company UNIQUE (company_id, receipt_number)
);

-- 6. Add Tracking Columns to Sales Order Items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='delivered_quantity') THEN
        ALTER TABLE sales_order_items ADD COLUMN delivered_quantity DECIMAL(12, 3) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='invoiced_quantity') THEN
        ALTER TABLE sales_order_items ADD COLUMN invoiced_quantity DECIMAL(12, 3) DEFAULT 0;
    END IF;
END $$;

-- 7. Add outstanding balance to Customers if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='current_outstanding') THEN
        ALTER TABLE customers ADD COLUMN current_outstanding DECIMAL(15, 2) DEFAULT 0;
    END IF;
END $$;

-- 8. Enable RLS
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (Standard Multi-Company)
CREATE POLICY "Users can view dispatches of their company" ON dispatches
    FOR SELECT USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can view invoices of their company" ON invoices
    FOR SELECT USING (company_id::text = current_setting('app.current_company_id', true));

-- 10. Standard Triggers for updated_at
CREATE TRIGGER update_dispatches_modtime BEFORE UPDATE ON dispatches FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_modified_column();
