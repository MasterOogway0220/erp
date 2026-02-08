-- Add code to companies if it doesn't exist (Fix for missing migration)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Update existing companies to have a default code based on name (first 3 chars upper)
UPDATE companies 
SET code = UPPER(SUBSTRING(name, 1, 3)) 
WHERE code IS NULL;

-- Fallback for empty names or short names
UPDATE companies SET code = 'STC' WHERE code IS NULL OR code = '';

-- Add constraints appropriately (optional, since we want to be safe)
-- ALTER TABLE companies ALTER COLUMN code SET NOT NULL;
