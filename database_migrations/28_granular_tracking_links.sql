-- Phase 5: Additional Traceability Links

-- 1. Link GRN items to SO items (optional but improves tracking speed)
ALTER TABLE grn_items 
ADD COLUMN IF NOT EXISTS sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL;

-- 2. Link Dispatch items to SO items
ALTER TABLE dispatch_items 
ADD COLUMN IF NOT EXISTS sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL;

-- 3. Link Invoice items to SO items
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grn_items_so_item ON grn_items(sales_order_item_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_so_item ON dispatch_items(sales_order_item_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_so_item ON invoice_items(sales_order_item_id);
