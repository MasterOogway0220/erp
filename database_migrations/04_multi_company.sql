-- Add company_id to core master tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add company_id to transactional tables
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
-- grn often links to PO, so company_id is implicit, but good to have for direct queries
ALTER TABLE grn ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id); 
ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
-- ncr (Non-conformance report)
ALTER TABLE ncr ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id);
