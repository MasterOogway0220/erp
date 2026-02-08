-- Migration to consolidate so_number into order_number
-- SOLVES: "null value in column 'so_number' of relation 'sales_orders' violates not-null constraint"

DO $$
BEGIN
    -- 1. Copy data from so_number to order_number if order_number is null
    UPDATE sales_orders 
    SET order_number = so_number 
    WHERE order_number IS NULL AND so_number IS NOT NULL;

    -- 2. Drop the redundant so_number column
    -- First check if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='so_number') THEN
        ALTER TABLE sales_orders DROP COLUMN so_number;
    END IF;

    -- 3. Ensure order_number is NOT NULL
    ALTER TABLE sales_orders ALTER COLUMN order_number SET NOT NULL;

    -- 4. Ensure order_number is unique per company (if not already handled by versioning)
    -- uq_sales_order_number_company_version already exists from migration 108
END $$;
