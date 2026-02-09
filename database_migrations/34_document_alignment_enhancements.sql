-- Migration 34: Document Alignment Enhancements

-- 1. Enhance Quotation Items with Technical Details
ALTER TABLE quotation_items 
ADD COLUMN IF NOT EXISTS tag_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS dwg_no VARCHAR(200),
ADD COLUMN IF NOT EXISTS item_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS unit_weight NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS total_weight_mt NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS delivery_period VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_material_code VARCHAR(100);

-- 2. Enhance Inventory with Tracking Details
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS mtc_type VARCHAR(20), -- '3.1', '3.2'
ADD COLUMN IF NOT EXISTS pieces INTEGER,
ADD COLUMN IF NOT EXISTS tpi_agency VARCHAR(100);

-- 3. Enhance Testing Standards
ALTER TABLE testing_standards ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Seed Testing Standards from TESTING MASTER
INSERT INTO testing_standards (name, description, category) 
VALUES 
('Chemical Analysis', 'Chemical composition verification', 'CHEMICAL'),
('Mechanical Test', 'Tensile, Yield, Elongation', 'MECHANICAL'),
('Flattening Test', 'Tube flattening per standard', 'MECHANICAL'),
('Flaring Test', 'Tube flaring per standard', 'MECHANICAL'),
('Macro Test', 'Macrostructural examination', 'METALLURGICAL'),
('Micro Test', 'Microstructural examination', 'METALLURGICAL'),
('IGC Practice E', 'Intergranular Corrosion Test', 'CORROSION'),
('IGC Practice E (Mag)', 'IGC Test with 20X-250X Mag', 'CORROSION'),
('Hardness Test', 'Brinell/Rockwell hardness', 'MECHANICAL'),
('Impact Test', 'Charpy V-Notch impact test', 'MECHANICAL'),
('Bend Test', 'Guided bend test', 'MECHANICAL')
ON CONFLICT (name) DO NOTHING;
