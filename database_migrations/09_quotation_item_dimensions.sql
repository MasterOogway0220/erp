-- Add dimension fields to quotation items for Standard Format support
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS schedule VARCHAR(50);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS wall_thickness DECIMAL(10,3);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS weight_per_mtr DECIMAL(10,4);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS total_weight DECIMAL(15,2);
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS grade VARCHAR(100); -- For Material/Grade in Non-Standard
