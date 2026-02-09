-- Migration 21: Enhanced Quotation and Item Details
-- Based on EXPORT QUOTATION FORMAT-1.xlsx and PIPES QUOTATION FORMAT (2).xlsx

-- 1. Add Export-specific and common fields to quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incoterms TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS material_origin TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tt_charges TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tpi_charges TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS certification TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS part_orders TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS attention TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS enquiry_reference TEXT;

-- 2. Add granular details to quotation_items
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS tag_no TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS dwg_no TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS item_no TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS dimension_tolerance TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS dm_type TEXT; -- e.g., OD, ID
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS wt_type TEXT; -- e.g., MIN, AVG
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS length_individual DECIMAL(15,2);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS no_of_tubes INTEGER;

-- 3. Update quotation_versions to include new fields in snapshots
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS incoterms TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS material_origin TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS tt_charges TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS tpi_charges TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS certification TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS part_orders TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS attention TEXT;
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS enquiry_reference TEXT;
