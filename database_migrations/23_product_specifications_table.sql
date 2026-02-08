-- Create product_specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL, -- e.g. "C.S. SEAMLESS PIPE"
    material_spec TEXT NOT NULL, -- e.g. "ASTM A106 GR.B"
    additional_spec TEXT, -- e.g. "NACE MR0175"
    ends TEXT, -- e.g. "BE", "PE"
    length_range TEXT, -- e.g. "5.00 - 7.00"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_prod_specs_product ON product_specifications(product_name);
CREATE INDEX IF NOT EXISTS idx_prod_specs_material ON product_specifications(material_spec);

-- Add RLS
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON product_specifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON product_specifications FOR INSERT TO authenticated WITH CHECK (true);
