CREATE TABLE quotation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL, -- 0, 1, 2, 3...
  version_label VARCHAR(10), -- Rev.00, Rev.01...

  -- Snapshot of quotation data
  quotation_data JSONB NOT NULL, -- Complete quotation at this version
  line_items JSONB NOT NULL,
  terms_conditions JSONB,

  -- Change tracking
  changed_by UUID REFERENCES employees(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT NOT NULL,
  changes_summary JSONB, -- Field-level diff

  -- Status
  is_current BOOLEAN DEFAULT false,

  UNIQUE(quotation_id, version_number)
);

CREATE INDEX idx_qv_quotation ON quotation_versions(quotation_id);
CREATE INDEX idx_qv_current ON quotation_versions(quotation_id, is_current)
  WHERE is_current = true;
