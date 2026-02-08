-- Create testing_standards table
CREATE TABLE IF NOT EXISTS testing_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name TEXT NOT NULL, -- e.g. "Chemical Analysis"
    test_standard TEXT, -- e.g. "ASTM A370"
    acceptance_criteria TEXT,
    testing_agency TEXT, -- optional default agency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS
ALTER TABLE testing_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON testing_standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON testing_standards FOR INSERT TO authenticated WITH CHECK (true);

-- Seed initial 12 test types
INSERT INTO testing_standards (test_name) VALUES
    ('Chemical Analysis'),
    ('Mechanical Test'),
    ('Flattening Test'),
    ('Flaring Test'),
    ('Hydrostatic Test'),
    ('Visual Inspection'),
    ('Dimensional Check'),
    ('Hardness Test'),
    ('Impact Test'),
    ('Bend Test'),
    ('PMI (Positive Material Identification)'),
    ('NDT (Non-Destructive Testing)');
