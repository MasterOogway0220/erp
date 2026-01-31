-- Sample Data Seeding Script for SteelERP
-- Run this after importing pipe sizes and product specs

-- 1. Insert Sample Companies
INSERT INTO companies (name, company_type, registered_address_line1, registered_city, registered_state, registered_pincode, registered_country, gstin, pan, email, website, telephone)
VALUES 
  ('Steel Trading Co.', 'Private Limited', '123 Industrial Area', 'Mumbai', 'Maharashtra', '400001', 'India', '27AAAAA0000A1Z5', 'AAAAA0000A', 'info@steeltrading.com', 'www.steeltrading.com', '+91-22-12345678'),
  ('Global Pipes Ltd.', 'Limited', '456 Export Zone', 'Ahmedabad', 'Gujarat', '380001', 'India', '24BBBBB0000B1Z5', 'BBBBB0000B', 'contact@globalpipes.com', 'www.globalpipes.com', '+91-79-87654321')
ON CONFLICT DO NOTHING;

-- 2. Insert Sample UOMs (if not exists)
INSERT INTO units_of_measure (code, name, unit_type)
VALUES 
  ('MTR', 'Meters', 'LENGTH'),
  ('KGS', 'Kilograms', 'WEIGHT'),
  ('NOS', 'Numbers', 'QUANTITY'),
  ('TON', 'Metric Tons', 'WEIGHT'),
  ('FT', 'Feet', 'LENGTH')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Sample Customers
INSERT INTO customers (name, email, telephone, address, city, state, country, gst_number, pan, currency, opening_balance, credit_limit)
VALUES 
  ('Reliance Industries Ltd', 'procurement@reliance.com', '+91-22-33445566', 'Maker Chambers IV, Nariman Point', 'Mumbai', 'Maharashtra', 'India', '27AAAAA1111A1Z5', 'AAAAA1111A', 'INR', 250000, 5000000),
  ('Larsen & Toubro Ltd', 'purchase@lnt.com', '+91-44-22334455', 'L&T House, Ballard Estate', 'Chennai', 'Tamil Nadu', 'India', '33BBBBB2222B1Z5', 'BBBBB2222B', 'INR', 180000, 3000000),
  ('Tata Steel Ltd', 'orders@tatasteel.com', '+91-33-66778899', 'Tata Centre, 43 Chowringhee Road', 'Kolkata', 'West Bengal', 'India', '19CCCCC3333C1Z5', 'CCCCC3333C', 'INR', 320000, 8000000),
  ('ONGC Limited', 'materials@ongc.in', '+91-11-44556677', 'Jeevan Bharati Tower, Connaught Place', 'New Delhi', 'Delhi', 'India', '07DDDDD4444D1Z5', 'DDDDD4444D', 'INR', 0, 10000000),
  ('Adani Ports', 'procurement@adaniports.com', '+91-79-25556666', 'Adani House, Nr Mithakhali Circle', 'Ahmedabad', 'Gujarat', 'India', '24EEEEE5555E1Z5', 'EEEEE5555E', 'INR', 150000, 4000000)
ON CONFLICT DO NOTHING;

-- 4. Insert Sample Buyers (linked to customers)
-- Note: You'll need to get actual customer IDs after insert
-- This is a template - adjust IDs as needed

-- Example for Reliance
INSERT INTO buyers (customer_id, name, designation, email, mobile, telephone)
SELECT 
  c.id,
  'Rajesh Kumar',
  'Senior Procurement Manager',
  'rajesh.kumar@reliance.com',
  '+91-9876543210',
  '+91-22-33445566'
FROM customers c WHERE c.name = 'Reliance Industries Ltd'
ON CONFLICT DO NOTHING;

INSERT INTO buyers (customer_id, name, designation, email, mobile, telephone)
SELECT 
  c.id,
  'Priya Sharma',
  'Materials Engineer',
  'priya.sharma@reliance.com',
  '+91-9876543211',
  '+91-22-33445567'
FROM customers c WHERE c.name = 'Reliance Industries Ltd'
ON CONFLICT DO NOTHING;

-- Example for L&T
INSERT INTO buyers (customer_id, name, designation, email, mobile, telephone)
SELECT 
  c.id,
  'Amit Patel',
  'Purchase Head',
  'amit.patel@lnt.com',
  '+91-9876543212',
  '+91-44-22334455'
FROM customers c WHERE c.name = 'Larsen & Toubro Ltd'
ON CONFLICT DO NOTHING;

-- 5. Insert Sample Products
-- Get UOM IDs first
DO $$
DECLARE
  mtr_id UUID;
  kgs_id UUID;
  nos_id UUID;
BEGIN
  SELECT id INTO mtr_id FROM units_of_measure WHERE code = 'MTR';
  SELECT id INTO kgs_id FROM units_of_measure WHERE code = 'KGS';
  SELECT id INTO nos_id FROM units_of_measure WHERE code = 'NOS';

  -- Insert Products
  INSERT INTO products (name, code, category, grade, hsn_code, base_price, primary_uom_id, description, is_active)
  VALUES 
    ('CS Seamless Pipe 2" SCH 40', 'PIPE-CS-0001', 'PIPES', 'ASTM A106 Gr.B', '7304', 5200, mtr_id, 'Carbon Steel Seamless Pipe, 2 inch, Schedule 40', true),
    ('CS Seamless Pipe 4" SCH 40', 'PIPE-CS-0002', 'PIPES', 'ASTM A106 Gr.B', '7304', 8500, mtr_id, 'Carbon Steel Seamless Pipe, 4 inch, Schedule 40', true),
    ('SS Seamless Pipe 2" SCH 40', 'PIPE-SS-0001', 'PIPES', 'ASTM A312 TP304', '7304', 12500, mtr_id, 'Stainless Steel Seamless Pipe, 2 inch, Schedule 40', true),
    ('SS Seamless Pipe 4" SCH 40', 'PIPE-SS-0002', 'PIPES', 'ASTM A312 TP304', '7304', 18900, mtr_id, 'Stainless Steel Seamless Pipe, 4 inch, Schedule 40', true),
    ('Flange WNRF 2" 150#', 'FLAN-CS-0001', 'FLANGES', 'ASTM A105', '7307', 850, nos_id, 'Weld Neck Raised Face Flange, 2 inch, 150 LBS', true),
    ('Flange WNRF 4" 150#', 'FLAN-CS-0002', 'FLANGES', 'ASTM A105', '7307', 1450, nos_id, 'Weld Neck Raised Face Flange, 4 inch, 150 LBS', true),
    ('Elbow 90° 2" SCH 40', 'FITT-CS-0001', 'FITTINGS', 'ASTM A234 WPB', '7307', 320, nos_id, '90 Degree Elbow, 2 inch, Schedule 40', true),
    ('Elbow 90° 4" SCH 40', 'FITT-CS-0002', 'FITTINGS', 'ASTM A234 WPB', '7307', 680, nos_id, '90 Degree Elbow, 4 inch, Schedule 40', true),
    ('Tee Equal 2" SCH 40', 'FITT-CS-0003', 'FITTINGS', 'ASTM A234 WPB', '7307', 420, nos_id, 'Equal Tee, 2 inch, Schedule 40', true),
    ('Reducer 4"x2" SCH 40', 'FITT-CS-0004', 'FITTINGS', 'ASTM A234 WPB', '7307', 380, nos_id, 'Concentric Reducer, 4x2 inch, Schedule 40', true)
  ON CONFLICT DO NOTHING;
END $$;

-- 6. Insert Sample Terms & Conditions
INSERT INTO terms_conditions (category, title, description, is_default, is_active)
VALUES 
  ('PAYMENT', 'Payment Terms - 30 Days', 'Payment: 30 days from the date of invoice', true, true),
  ('PAYMENT', 'Payment Terms - Advance', 'Payment: 100% advance against Proforma Invoice', false, true),
  ('DELIVERY', 'Delivery - Ex-Works', 'Delivery: Ex-Works Mumbai. Freight to be borne by buyer.', true, true),
  ('DELIVERY', 'Delivery - FOR Destination', 'Delivery: FOR Destination as per buyer requirement', false, true),
  ('VALIDITY', 'Validity - 30 Days', 'Offer valid for 30 days from quotation date', true, true),
  ('WARRANTY', 'Standard Warranty', 'Material warranty as per mill test certificate. No warranty for workmanship or installation.', true, true),
  ('INSPECTION', 'Third Party Inspection', 'Third party inspection allowed at buyer cost with prior notice', false, true),
  ('PACKING', 'Standard Packing', 'Standard export worthy packing included in price', true, true)
ON CONFLICT DO NOTHING;

-- Success Message
SELECT 'Sample data seeded successfully!' as message;
