-- Create pipe_sizes_cs_as table
CREATE TABLE IF NOT EXISTS pipe_sizes_cs_as (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    size TEXT NOT NULL,
    od_mm DECIMAL(10, 3) NOT NULL,
    wt_mm DECIMAL(10, 3) NOT NULL,
    weight_kg_m DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create pipe_sizes_ss_ds table
CREATE TABLE IF NOT EXISTS pipe_sizes_ss_ds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    size TEXT NOT NULL,
    od_mm DECIMAL(10, 3) NOT NULL,
    wt_mm DECIMAL(10, 3) NOT NULL,
    weight_kg_m DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for faster lookup by size
CREATE INDEX IF NOT EXISTS idx_pipe_sizes_cs_as_size ON pipe_sizes_cs_as(size);
CREATE INDEX IF NOT EXISTS idx_pipe_sizes_ss_ds_size ON pipe_sizes_ss_ds(size);

-- Add RLS
ALTER TABLE pipe_sizes_cs_as ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipe_sizes_ss_ds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON pipe_sizes_cs_as FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON pipe_sizes_ss_ds FOR SELECT TO authenticated USING (true);
-- Allow inserts for initial seeding/admin
CREATE POLICY "Enable insert access for authenticated users" ON pipe_sizes_cs_as FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable insert access for authenticated users" ON pipe_sizes_ss_ds FOR INSERT TO authenticated WITH CHECK (true);
