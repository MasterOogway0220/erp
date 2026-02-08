-- Migration: Add unique constraints and performance indexes
-- Purpose: Prevent duplicate document numbers and improve query performance
-- Date: 2026-02-08

-- Add unique constraints for document numbers
ALTER TABLE enquiries 
ADD CONSTRAINT uq_enquiry_number_company 
UNIQUE (company_id, enquiry_number);

ALTER TABLE quotations 
ADD CONSTRAINT uq_quotation_number_company_version 
UNIQUE (company_id, quotation_number, version_number);

ALTER TABLE sales_orders 
ADD CONSTRAINT uq_sales_order_number_company 
UNIQUE (company_id, order_number);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON quotations(valid_until);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_po ON sales_orders(customer_po_number);

-- Add comment for documentation
COMMENT ON CONSTRAINT uq_enquiry_number_company ON enquiries IS 'Ensures enquiry numbers are unique per company';
COMMENT ON CONSTRAINT uq_quotation_number_company_version ON quotations IS 'Ensures quotation numbers with version are unique per company';
COMMENT ON CONSTRAINT uq_sales_order_number_company ON sales_orders IS 'Ensures sales order numbers are unique per company';
