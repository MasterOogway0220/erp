ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bank_detail_id UUID REFERENCES company_bank_details(id);
ALTER TABLE quotation_versions ADD COLUMN IF NOT EXISTS bank_detail_id UUID;
