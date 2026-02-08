-- Migration to fix sales_order_status enum
-- SOLVES: "invalid input value for enum sales_order_status: 'draft'"

-- Add new values to the enum
-- PostgreSQL doesn't support IF NOT EXISTS for ADD VALUE directly in a way that's easy in a single script without DO blocks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'sales_order_status' AND enumlabel = 'draft') THEN
        ALTER TYPE sales_order_status ADD VALUE 'draft' BEFORE 'open';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'sales_order_status' AND enumlabel = 'confirmed') THEN
        ALTER TYPE sales_order_status ADD VALUE 'confirmed' AFTER 'open';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'sales_order_status' AND enumlabel = 'processing') THEN
        ALTER TYPE sales_order_status ADD VALUE 'processing' AFTER 'confirmed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'sales_order_status' AND enumlabel = 'ready_for_dispatch') THEN
        ALTER TYPE sales_order_status ADD VALUE 'ready_for_dispatch' AFTER 'processing';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'sales_order_status' AND enumlabel = 'dispatched') THEN
        ALTER TYPE sales_order_status ADD VALUE 'dispatched' BEFORE 'completed';
    END IF;

    -- Standardize partially_dispatched if it's missing (schemas.ts uses partial_dispatch)
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'sales_order_status' AND enumlabel = 'partially_dispatched') THEN
        ALTER TYPE sales_order_status ADD VALUE 'partially_dispatched' AFTER 'partial_dispatch';
    END IF;
END $$;
