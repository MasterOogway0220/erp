-- Add created_at column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE buyers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
    EXECUTE 'UPDATE buyers SET created_at = NOW() WHERE created_at IS NULL';
    ALTER TABLE buyers ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE buyers ALTER COLUMN created_at SET DEFAULT NOW();
END $$;

-- Add updated_at column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE buyers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
    EXECUTE 'UPDATE buyers SET updated_at = NOW() WHERE updated_at IS NULL';
    ALTER TABLE buyers ALTER COLUMN updated_at SET NOT NULL;
    ALTER TABLE buyers ALTER COLUMN updated_at SET DEFAULT NOW();
END $$;

-- Add opening_balance column if it doesn't exist, backfill, and set type
DO $$ BEGIN
    ALTER TABLE buyers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC;
    EXECUTE 'UPDATE buyers SET opening_balance = 0 WHERE opening_balance IS NULL';
    ALTER TABLE buyers ALTER COLUMN opening_balance TYPE DECIMAL(15,2);
    ALTER TABLE buyers ALTER COLUMN opening_balance SET DEFAULT 0;
    ALTER TABLE buyers ALTER COLUMN opening_balance SET NOT NULL;
END $$;

-- Rename 'name' column to 'buyer_name'
ALTER TABLE buyers RENAME COLUMN name TO buyer_name;

-- Adjust column lengths as per gap analysis
ALTER TABLE buyers ALTER COLUMN designation TYPE VARCHAR(50);
ALTER TABLE buyers ALTER COLUMN mobile TYPE VARCHAR(20);
