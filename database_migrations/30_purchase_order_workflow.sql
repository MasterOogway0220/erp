-- Phase 9: Purchase Order Workflow Enhancements

-- 1. Add workflow columns to purchase_orders
DO $$ 
BEGIN
    -- Approval Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='approved_by') THEN
        ALTER TABLE purchase_orders ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='approved_at') THEN
        ALTER TABLE purchase_orders ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Acknowledgment Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='acknowledged_at') THEN
        ALTER TABLE purchase_orders ADD COLUMN acknowledged_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Tracking Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='sent_at') THEN
        ALTER TABLE purchase_orders ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Add SO Item linkage to purchase_order_items for granular tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_order_items' AND column_name='so_item_id') THEN
        ALTER TABLE purchase_order_items ADD COLUMN so_item_id UUID REFERENCES sales_order_items(id);
    END IF;
END $$;
