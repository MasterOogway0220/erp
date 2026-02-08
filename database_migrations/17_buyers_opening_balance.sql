-- Add opening_balance to buyers if not exists
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0;

-- Ensure customer_id index exists (duplicate check is harmless with IF NOT EXISTS usually, but standard SQL doesn't always support IF NOT EXISTS on index without PG version check. But for now assumes Postgres 9.5+)
CREATE INDEX IF NOT EXISTS idx_buyers_customer_id ON buyers(customer_id);

-- Add designation if missing (03 had it, but just in case)
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS designation TEXT;
