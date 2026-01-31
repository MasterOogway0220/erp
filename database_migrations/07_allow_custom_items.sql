-- Allow product_id to be nullable for non-standard items
ALTER TABLE quotation_items ALTER COLUMN product_id DROP NOT NULL;

-- Add description column for non-standard items
-- Note: 'description' might exist on some schemas, checking implies 'IF NOT EXISTS' logic but Postgres usually requires a DO block for SAFE IF NOT EXISTS on columns or just simple ADD IF NOT EXISTS (Postgres 9.6+ supports IF NOT EXISTS)
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS product_name TEXT; -- In case we want to store the custom name separate from description
