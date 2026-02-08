CREATE TABLE quotation_terms_selected (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms_conditions_library(id),
  term_text TEXT NOT NULL, -- Editable copy
  display_order INTEGER,
  is_selected BOOLEAN DEFAULT true
);