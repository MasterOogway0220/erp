-- Phase 3: ISO 9001:2018 Compliance Enhancements

-- 1. Buyer Linkage in Enquiries (ISO 8.2.1)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);
CREATE INDEX IF NOT EXISTS idx_enquiries_buyer_id ON enquiries(buyer_id);

-- 2. Vendor Evaluation System (ISO 8.4.1)
CREATE TABLE IF NOT EXISTS vendor_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  delivery_score INTEGER CHECK (delivery_score BETWEEN 1 AND 5),
  pricing_score INTEGER CHECK (pricing_score BETWEEN 1 AND 5),
  communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
  overall_score DECIMAL(3,2),
  remarks TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_evaluations_vendor_id ON vendor_evaluations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_evaluations_date ON vendor_evaluations(evaluation_date DESC);

-- 3. Item-Level Status Tracking (Point 12)
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SO_CONFIRMED';
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS linked_po_id UUID REFERENCES purchase_orders(id);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS linked_grn_id UUID REFERENCES grn(id);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS linked_inventory_id UUID REFERENCES inventory(id);

CREATE TABLE IF NOT EXISTS item_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_item_id UUID REFERENCES sales_order_items(id) NOT NULL,
  status VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_item_status_history_so_item ON item_status_history(so_item_id);
CREATE INDEX IF NOT EXISTS idx_item_status_history_date ON item_status_history(updated_at DESC);

-- 4. Document Numbering Enhancement
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS document_year INTEGER;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS document_year INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS document_year INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_year INTEGER;

-- Update existing records with current year
UPDATE quotations SET document_year = EXTRACT(YEAR FROM created_at) WHERE document_year IS NULL;
UPDATE sales_orders SET document_year = EXTRACT(YEAR FROM created_at) WHERE document_year IS NULL;
UPDATE purchase_orders SET document_year = EXTRACT(YEAR FROM created_at) WHERE document_year IS NULL;
UPDATE invoices SET document_year = EXTRACT(YEAR FROM created_at) WHERE document_year IS NULL;

-- 5. Mandatory MTC Validation (ISO 7.5.3)
ALTER TABLE grn ADD COLUMN IF NOT EXISTS mtc_uploaded BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS mtc_status VARCHAR(20) DEFAULT 'PENDING';

-- Add check constraint to ensure MTC is uploaded before GRN completion
-- (This will be enforced in application logic as well)

COMMENT ON COLUMN enquiries.buyer_id IS 'ISO 8.2.1: Track specific buyer contact for customer communication';
COMMENT ON TABLE vendor_evaluations IS 'ISO 8.4.1: External provider evaluation and selection criteria';
COMMENT ON TABLE item_status_history IS 'Point 12: Product-by-product order status tracking for customer queries';
COMMENT ON COLUMN sales_order_items.status IS 'Item-level status: SO_CONFIRMED, PO_PLACED, MATERIAL_RECEIVED, UNDER_QC, QC_ACCEPTED, QC_REJECTED, READY_TO_DISPATCH, DISPATCHED, INVOICED, PAID';
