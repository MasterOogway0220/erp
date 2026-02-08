CREATE TABLE terms_conditions_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_number INTEGER NOT NULL, -- 1-15
  term_text TEXT NOT NULL,
  is_standard BOOLEAN DEFAULT true,
  category VARCHAR(50), -- Price, Delivery, Payment, etc.
  is_active BOOLEAN DEFAULT true
);