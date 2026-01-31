-- Add company_id to all transactional tables for multi-company support

DO $$ 
BEGIN
    -- Enquiries
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enquiries' AND column_name='company_id') THEN
        ALTER TABLE enquiries ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    -- Quotations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='company_id') THEN
        ALTER TABLE quotations ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    -- Sales Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='company_id') THEN
        ALTER TABLE sales_orders ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    -- Purchase Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='company_id') THEN
        ALTER TABLE purchase_orders ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    -- GRN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grn' AND column_name='company_id') THEN
        ALTER TABLE grn ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    -- Invoices
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='company_id') THEN
        ALTER TABLE invoices ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;

    -- Purchase Requests 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_requests' AND column_name='company_id') THEN
        ALTER TABLE purchase_requests ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;
