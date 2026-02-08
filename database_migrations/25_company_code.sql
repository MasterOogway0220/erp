-- Add code to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Update existing companies to have a default code if needed (optional, assuming 'NPS' concept)
UPDATE companies SET code = 'NPS' WHERE code IS NULL;

-- Make it not null after update
ALTER TABLE companies ALTER COLUMN code SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
