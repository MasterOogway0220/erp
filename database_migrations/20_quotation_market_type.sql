-- Migration 20: Add Market Type to Quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS market_type VARCHAR(50) DEFAULT 'DOMESTIC'; -- 'DOMESTIC', 'EXPORT'

-- Optional: Add check constraint if supported by the DB flavor (Postgres)
-- ALTER TABLE quotations ADD CONSTRAINT check_market_type CHECK (market_type IN ('DOMESTIC', 'EXPORT'));
