-- Phase 5: Order Status Tracking Enhancements

-- 1. Add sales_order_item_id to purchase_order_items
-- This allows tracking which PO item fulfills which SO line item
ALTER TABLE purchase_order_items 
ADD COLUMN IF NOT EXISTS sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL;

-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_po_items_so_item ON purchase_order_items(sales_order_item_id);

-- 3. Add expected_delivery_date to purchase_order_items if not exists
-- (Header level exists, but item level allows more granularity if needed)
ALTER TABLE purchase_order_items 
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;

-- 4. Registry for tracking status history (optional but useful)
CREATE TABLE IF NOT EXISTS order_item_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    reference_id UUID, -- ID of PO, GRN, Inspection, Dispatch
    reference_type VARCHAR(50), -- 'PO', 'GRN', 'INSPECTION', 'DISPATCH', 'INVOICE'
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_order_item_status_so_item ON order_item_status_history(sales_order_item_id);
