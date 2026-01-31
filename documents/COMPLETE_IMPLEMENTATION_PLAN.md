# STEEL ERP - COMPLETE IMPLEMENTATION PLAN
## 8-Week Production Deployment Roadmap

**Project:** SteelERP for Oil, Gas & Petrochemical Trading  
**Client:** Karan Patil / Uttam Sir  
**Timeline:** 8 Weeks (56 Days)  
**Current Status:** 60% Complete (Screens built, data models incomplete)  
**Target:** 100% Production-Ready System

---

## EXECUTIVE SUMMARY

### Current State
- ✅ **Screens/Workflows:** 75% complete
- ❌ **Data Models/Masters:** 30% complete
- ❌ **Business Logic:** 40% complete
- **Overall:** 60% complete

### Required Work
- **18 Critical Features** missing from ERP_CHANGES document
- **8 Master Tables** completely missing
- **3 Major Modules** need redesign (Quotation, Product, Customer)
- **271 Rows** of master data to import from Excel files
- **ISO 9001 Compliance** gaps in versioning and document control

### Resource Analysis
**Available Excel Master Files:**
1. ✅ PIPES_SIZE_MASTER_SS_DS_PIPES.xlsx (80 rows) - Stainless/Duplex steel pipes
2. ✅ PIPES_SIZE_MASTER_CS_AS_PIPES.xlsx (191 rows) - Carbon/Alloy steel pipes
3. ✅ PRODUCT_SPEC_MASTER_-_1.xlsx (245 rows) - Product specifications
4. ✅ TESTING_MASTER_FOR_LAB_LETTER.xlsx (11 tests) - QC test types
5. ✅ INVENTORY_MASTER_-_LATEST.xlsx - Current inventory structure reference
6. ✅ PIPES_QUOTATION_FORMAT.xlsx - Standard quotation template
7. ✅ EXPORT_QUOTATION_FORMAT-1.xlsx - Export quotation template

**Total Master Data Available:** 271+ records ready for import

---

## PART 1: CRITICAL GAPS (Must Fix Before Production)

### Gap 1: Company Master (BLOCKER)
**Status:** ❌ 0% - Table doesn't exist  
**Impact:** Cannot generate quotations, invoices, or handle multi-entity  
**Priority:** 🚨 CRITICAL

**Required Fields:**
- Company type (Proprietorship/Partnership/LLP/Limited/Pvt Ltd/HUF)
- Company name, legal name
- Registered address (Line 1, Line 2, City, Pin, State, Country)
- Warehouse address (separate fields)
- PAN, TAN, GSTIN, CIN numbers
- Contact details (Phone, Email, Website)
- Financial year settings (start month, end month)
- Logo upload
- Active/Inactive status

**Database Schema:**
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_type VARCHAR(50) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  
  -- Registered Address
  reg_address_line1 VARCHAR(200),
  reg_address_line2 VARCHAR(200),
  reg_city VARCHAR(100),
  reg_pin VARCHAR(20),
  reg_state VARCHAR(100),
  reg_country VARCHAR(100) DEFAULT 'India',
  
  -- Warehouse Address
  wh_address_line1 VARCHAR(200),
  wh_address_line2 VARCHAR(200),
  wh_city VARCHAR(100),
  wh_pin VARCHAR(20),
  wh_state VARCHAR(100),
  wh_country VARCHAR(100) DEFAULT 'India',
  
  -- Tax & Legal
  pan VARCHAR(20),
  tan VARCHAR(20),
  gstin VARCHAR(20),
  cin VARCHAR(50),
  
  -- Contact
  phone VARCHAR(50),
  email VARCHAR(200),
  website VARCHAR(200),
  
  -- Financial Year
  fy_start_month INTEGER DEFAULT 4, -- April
  fy_end_month INTEGER DEFAULT 3,   -- March
  
  -- Metadata
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add company_id to all transactional tables
ALTER TABLE quotations ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE sales_orders ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE purchase_orders ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE customers ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE vendors ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE products ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE inventory ADD COLUMN company_id UUID REFERENCES companies(id);
```

**UI Requirements:**
- Company Master CRUD pages (/masters/companies, /new, /[id])
- Company selection dropdown in user session
- Company logo display in all documents
- Financial year selector in reports

**Effort:** 3 days

---

### Gap 2: Employee Master (HIGH PRIORITY)
**Status:** ⚠️ 20% - Only auth.users exists  
**Impact:** No department mapping, no employee reports  
**Priority:** 🔴 HIGH

**Required Fields:**
- Link to auth.users (user_id)
- Department (Purchase/Sales/Quality/Warehouse/Accounts)
- Designation
- Full name
- Email, Mobile, Phone
- Reporting manager
- Company assignment

**Database Schema:**
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  company_id UUID REFERENCES companies(id),
  
  employee_code VARCHAR(50) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  department VARCHAR(50) NOT NULL, -- ENUM: PURCHASE, SALES, QUALITY, WAREHOUSE, ACCOUNTS, MANAGEMENT
  designation VARCHAR(200),
  
  email VARCHAR(200),
  mobile VARCHAR(50),
  phone VARCHAR(50),
  
  reporting_manager_id UUID REFERENCES employees(id),
  
  date_of_joining DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for quick department lookups
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_company ON employees(company_id);
```

**UI Requirements:**
- Employee Master pages (/masters/employees)
- Employee profile page
- Department-wise employee list
- Link employee to auth user during registration

**Effort:** 2 days

---

### Gap 3: Buyer Master (CRITICAL)
**Status:** ❌ 0% - Table doesn't exist  
**Impact:** Cannot track "which buyer gives best business" (Karan's #1 requirement)  
**Priority:** 🚨 CRITICAL

**Required Fields:**
- Link to customer
- Buyer name, designation
- Email, Mobile, Phone
- Is primary contact
- Performance metrics

**Database Schema:**
```sql
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  
  buyer_name VARCHAR(200) NOT NULL,
  designation VARCHAR(200),
  email VARCHAR(200),
  mobile VARCHAR(50),
  phone VARCHAR(50),
  
  is_primary_contact BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Business metrics (computed fields)
  total_enquiries INTEGER DEFAULT 0,
  total_quotations INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_order_value DECIMAL(15,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- percentage
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(customer_id, email)
);

-- Link enquiries and quotations to buyer
ALTER TABLE enquiries ADD COLUMN buyer_id UUID REFERENCES buyers(id);
ALTER TABLE quotations ADD COLUMN buyer_id UUID REFERENCES buyers(id);

-- Create trigger to update buyer metrics
CREATE OR REPLACE FUNCTION update_buyer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE buyers SET
    total_enquiries = (SELECT COUNT(*) FROM enquiries WHERE buyer_id = NEW.buyer_id),
    total_quotations = (SELECT COUNT(*) FROM quotations WHERE buyer_id = NEW.buyer_id),
    total_orders = (SELECT COUNT(*) FROM sales_orders so 
                    JOIN quotations q ON so.quotation_id = q.id 
                    WHERE q.buyer_id = NEW.buyer_id),
    total_order_value = (SELECT COALESCE(SUM(total_amount), 0) FROM sales_orders so
                         JOIN quotations q ON so.quotation_id = q.id
                         WHERE q.buyer_id = NEW.buyer_id)
  WHERE id = NEW.buyer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_buyer_metrics_quotation
AFTER INSERT OR UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION update_buyer_metrics();
```

**UI Requirements:**
- Buyer Master pages (/masters/buyers)
- Multi-buyer per customer interface
- Buyer performance dashboard
- Buyer selection in enquiry/quotation forms
- Reports: "Top 10 buyers by conversion", "Buyer-wise business analysis"

**Effort:** 3 days

---

### Gap 4: Customer Enhancements
**Status:** ⚠️ 50% - Basic customer exists  
**Impact:** Missing opening balance, dispatch addresses, T&C defaults  
**Priority:** 🔴 HIGH

**Required Additions:**

**A) Add fields to customers table:**
```sql
ALTER TABLE customers ADD COLUMN opening_balance DECIMAL(15,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN opening_balance_date DATE;
ALTER TABLE customers ADD COLUMN default_terms_id UUID;
ALTER TABLE customers ADD COLUMN customer_material_code_prefix VARCHAR(20);
ALTER TABLE customers ADD COLUMN payment_terms VARCHAR(200);
ALTER TABLE customers ADD COLUMN delivery_terms VARCHAR(200);
```

**B) Create dispatch addresses table:**
```sql
CREATE TABLE customer_dispatch_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  
  address_type VARCHAR(50), -- BILLING, SHIPPING, CONSIGNEE
  company_name VARCHAR(200),
  contact_person VARCHAR(200),
  
  address_line1 VARCHAR(200),
  address_line2 VARCHAR(200),
  city VARCHAR(100),
  pin VARCHAR(20),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  
  gstin VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(200),
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_default_per_type UNIQUE(customer_id, address_type, is_default)
);
```

**UI Requirements:**
- Customer form enhancement with opening balance
- Dispatch address management (one-to-many)
- Default billing/shipping/consignee address selection
- Opening balance reconciliation report

**Effort:** 2 days

---

### Gap 5: Quotation Versioning (ISO 9001 CRITICAL)
**Status:** ❌ 0% - No versioning  
**Impact:** ISO 9001 Clause 7.5.2 violation, cannot track revisions  
**Priority:** 🚨 CRITICAL

**Required Implementation:**

**Database Schema:**
```sql
ALTER TABLE quotations ADD COLUMN version_number INTEGER DEFAULT 1;
ALTER TABLE quotations ADD COLUMN parent_quotation_id UUID REFERENCES quotations(id);
ALTER TABLE quotations ADD COLUMN is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE quotations ADD COLUMN superseded_by UUID REFERENCES quotations(id);
ALTER TABLE quotations ADD COLUMN revision_reason TEXT;

-- Auto-increment version on revision
CREATE OR REPLACE FUNCTION increment_quotation_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_quotation_id IS NOT NULL THEN
    -- Get parent's version and increment
    SELECT version_number + 1 INTO NEW.version_number
    FROM quotations WHERE id = NEW.parent_quotation_id;
    
    -- Mark parent as not latest
    UPDATE quotations 
    SET is_latest_version = false, 
        superseded_by = NEW.id
    WHERE id = NEW.parent_quotation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_quotation_version
BEFORE INSERT ON quotations
FOR EACH ROW EXECUTE FUNCTION increment_quotation_version();
```

**UI Requirements:**
- "Create Revision" button on quotation view
- Version chain display (Rev.01 → Rev.02 → Rev.03)
- Revision comparison view (show what changed)
- Revision reason input field
- Version history timeline

**Business Logic:**
1. User views quotation and clicks "Create Revision"
2. System copies all data to new quotation
3. Sets parent_quotation_id, increments version_number
4. Marks original as not latest version
5. User edits and submits new version
6. Both versions retained for audit trail

**Effort:** 4 days

---

### Gap 6: Dual Quotation Formats (CRITICAL)
**Status:** ❌ 0% - Single format only  
**Impact:** Cannot handle standard pipes vs non-standard items  
**Priority:** 🚨 CRITICAL

**Required Implementation:**

**Database Schema:**
```sql
-- Add quotation type
ALTER TABLE quotations ADD COLUMN quotation_type VARCHAR(20) DEFAULT 'NON_STANDARD';
-- ENUM: STANDARD, NON_STANDARD

-- For standard quotations, link to pipe size master
ALTER TABLE quotation_items ADD COLUMN pipe_size_id UUID;
ALTER TABLE quotation_items ADD COLUMN auto_calculated_weight DECIMAL(15,4);

-- For non-standard, free text description
ALTER TABLE quotation_items ADD COLUMN description_text TEXT;
```

**Create Pipe Size Masters:**
```sql
CREATE TABLE pipe_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_type VARCHAR(10) NOT NULL, -- SS, DS, CS, AS
  size_inch VARCHAR(20) NOT NULL,
  od_mm DECIMAL(10,2),
  schedule VARCHAR(20),
  wall_thickness_mm DECIMAL(10,3),
  weight_kg_per_m DECIMAL(10,4),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(material_type, size_inch, schedule)
);

-- Import data from Excel files
-- SS/DS: 80 rows from PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx
-- CS/AS: 191 rows from PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx
```

**Import Script:**
```python
import pandas as pd
from supabase import create_client

# Read SS/DS pipes
ss_df = pd.read_excel('PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx')
for _, row in ss_df.iterrows():
    material_type = 'SS' if 'SS' in sheet_name else 'DS'
    # Insert into pipe_sizes table
    
# Read CS/AS pipes  
cs_df = pd.read_excel('PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx')
for _, row in cs_df.iterrows():
    material_type = 'CS' if 'CS' in sheet_name else 'AS'
    # Insert into pipe_sizes table
```

**UI Requirements:**

**Standard Quotation Flow:**
1. Select "Standard Quotation" type
2. Line item entry:
   - Material Type dropdown (SS, DS, CS, AS)
   - Size dropdown (from pipe_sizes where material_type = selected)
   - Schedule dropdown (filtered by size)
   - Quantity in meters
   - Weight auto-calculated (qty * weight_kg_per_m)
   - Unit price entry
   - Amount auto-calculated
3. Uses PIPES_QUOTATION_FORMAT.xlsx template for PDF

**Non-Standard Quotation Flow:**
1. Select "Non-Standard Quotation" type
2. Line item entry:
   - Free-text description (rich text editor)
   - Quantity
   - Unit
   - Unit price
   - Amount
3. Uses EXPORT_QUOTATION_FORMAT-1.xlsx template for PDF

**Effort:** 6 days (including master data import)

---

### Gap 7: Material Code Auto-Generation
**Status:** ❌ 0% - No auto-generation  
**Impact:** Cannot track pricing history, no dual code system  
**Priority:** 🔴 HIGH

**Required Implementation:**

**Database Schema:**
```sql
ALTER TABLE products ADD COLUMN internal_material_code VARCHAR(50) UNIQUE;
ALTER TABLE products ADD COLUMN customer_material_code VARCHAR(100);
ALTER TABLE products ADD COLUMN auto_code_sequence INTEGER;
ALTER TABLE products ADD COLUMN category_code VARCHAR(10);

-- Create sequence tracker
CREATE TABLE material_code_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_code VARCHAR(10) NOT NULL,
  material_code VARCHAR(10) NOT NULL,
  last_sequence INTEGER DEFAULT 0,
  UNIQUE(category_code, material_code)
);

-- Auto-generate internal code
CREATE OR REPLACE FUNCTION generate_internal_material_code(
  p_category VARCHAR,
  p_material VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  category_abbr VARCHAR(10);
  material_abbr VARCHAR(10);
  next_seq INTEGER;
  new_code VARCHAR(50);
BEGIN
  -- Get or create sequence
  INSERT INTO material_code_sequences (category_code, material_code, last_sequence)
  VALUES (p_category, p_material, 0)
  ON CONFLICT (category_code, material_code) 
  DO UPDATE SET last_sequence = material_code_sequences.last_sequence + 1
  RETURNING last_sequence + 1 INTO next_seq;
  
  -- Format: CATEGORY-MATERIAL-NNNN
  new_code := UPPER(SUBSTRING(p_category, 1, 4)) || '-' || 
              UPPER(SUBSTRING(p_material, 1, 2)) || '-' || 
              LPAD(next_seq::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate on insert
CREATE OR REPLACE FUNCTION auto_generate_material_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.internal_material_code IS NULL THEN
    NEW.internal_material_code := generate_internal_material_code(
      NEW.category, 
      COALESCE(NEW.product_code, 'GEN')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_material_code
BEFORE INSERT ON products
FOR EACH ROW EXECUTE FUNCTION auto_generate_material_code();
```

**Examples of Generated Codes:**
- PIPE-CS-0001 (Carbon Steel Pipe, sequence 1)
- FLAN-SS-0023 (Stainless Steel Flange, sequence 23)
- VALV-BALL-0145 (Ball Valve, sequence 145)
- FITT-ELBO-0067 (Elbow Fitting, sequence 67)

**Product Pricing History:**
```sql
CREATE TABLE product_pricing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  quotation_id UUID REFERENCES quotations(id),
  customer_id UUID REFERENCES customers(id),
  buyer_id UUID REFERENCES buyers(id),
  
  quoted_price DECIMAL(15,2) NOT NULL,
  quoted_date DATE NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  order_received BOOLEAN DEFAULT false,
  sales_order_id UUID REFERENCES sales_orders(id),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auto-populate on quotation approval
CREATE OR REPLACE FUNCTION record_pricing_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    INSERT INTO product_pricing_history (
      product_id, quotation_id, customer_id, buyer_id,
      quoted_price, quoted_date
    )
    SELECT 
      qi.product_id, NEW.id, NEW.customer_id, NEW.buyer_id,
      qi.unit_price, NEW.quotation_date
    FROM quotation_items qi
    WHERE qi.quotation_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_record_pricing
AFTER UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION record_pricing_history();
```

**UI Requirements:**
- Material code auto-generated on product creation
- Customer material code mapping field
- Pricing insights report:
  - Last quoted price for product to customer
  - Average price across all customers
  - Price trends over time
  - Conversion rate per product

**Effort:** 3 days

---

### Gap 8: PDF Generation (CRITICAL)
**Status:** ❌ 0% - No PDF generation  
**Impact:** Cannot send quotations to customers  
**Priority:** 🚨 CRITICAL

**Technology Choice:**
- Use `@react-pdf/renderer` for React-based PDF generation
- Template-based approach using client's Excel formats

**Implementation:**

**Install Dependencies:**
```bash
npm install @react-pdf/renderer
```

**Create PDF Templates:**

**File: `/lib/pdf/quotation-templates/standard-quotation.tsx`**
```typescript
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  // ... more styles based on PIPES_QUOTATION_FORMAT.xlsx
});

export const StandardQuotationPDF = ({ quotation, company, showPrice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Company Header with Logo */}
      <View style={styles.header}>
        {company.logo_url && <Image src={company.logo_url} style={{ width: 100 }} />}
        <View>
          <Text>{company.company_name}</Text>
          <Text>{company.reg_address_line1}</Text>
          <Text>GSTIN: {company.gstin}</Text>
        </View>
      </View>
      
      {/* Quotation Details */}
      <Text>Quotation No: {quotation.quotation_number}</Text>
      <Text>Date: {quotation.quotation_date}</Text>
      <Text>Version: Rev.{String(quotation.version_number).padStart(2, '0')}</Text>
      
      {/* Customer Details */}
      <Text>To: {quotation.customer.name}</Text>
      
      {/* Items Table */}
      <View style={styles.table}>
        {quotation.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text>{item.description}</Text>
            <Text>{item.quantity} {item.unit}</Text>
            {showPrice ? (
              <>
                <Text>₹{item.unit_price}</Text>
                <Text>₹{item.amount}</Text>
              </>
            ) : (
              <>
                <Text>QUOTED</Text>
                <Text>QUOTED</Text>
              </>
            )}
          </View>
        ))}
      </View>
      
      {/* Terms & Conditions */}
      <View style={styles.terms}>
        {quotation.terms.map((term, idx) => (
          <Text key={idx}>• {term.description}</Text>
        ))}
      </View>
    </Page>
  </Document>
);
```

**API Route for PDF Generation:**

**File: `/app/api/quotations/[id]/pdf/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { StandardQuotationPDF } from '@/lib/pdf/quotation-templates/standard-quotation';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const showPrice = req.nextUrl.searchParams.get('showPrice') === 'true';
  
  // Fetch quotation with all relations
  const { data: quotation } = await supabase
    .from('quotations')
    .select(`
      *,
      customer:customers(*),
      company:companies(*),
      items:quotation_items(*),
      terms:quotation_terms(*, terms_conditions(*))
    `)
    .eq('id', params.id)
    .single();
  
  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    <StandardQuotationPDF 
      quotation={quotation} 
      company={quotation.company}
      showPrice={showPrice}
    />
  );
  
  // Store in Supabase Storage
  const filename = `quotation_${quotation.quotation_number}_${showPrice ? 'with_price' : 'quoted'}.pdf`;
  await supabase.storage
    .from('documents')
    .upload(`quotations/${quotation.id}/${filename}`, pdfBuffer);
  
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

**UI Requirements:**
- "Print Quotation" button with dropdown:
  - "Print with Prices"
  - "Print without Prices (QUOTED)"
- "Email Quotation" button (Phase 2)
- PDF preview modal
- Download and open in new tab options

**Templates to Create:**
1. Standard Quotation (based on PIPES_QUOTATION_FORMAT.xlsx)
2. Export Quotation (based on EXPORT_QUOTATION_FORMAT-1.xlsx)
3. Sales Order
4. Purchase Order
5. Invoice (GST compliant)
6. Packing List
7. Dispatch Note

**Effort:** 5 days (all templates)

---

### Gap 9: Terms & Conditions Management
**Status:** ❌ 0% - No T&C system  
**Impact:** Cannot customize T&C per quotation  
**Priority:** 🟡 MEDIUM

**Database Schema:**
```sql
CREATE TABLE terms_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  
  category VARCHAR(100), -- PAYMENT, DELIVERY, WARRANTY, INSPECTION, GENERAL
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  is_default BOOLEAN DEFAULT false,
  product_category VARCHAR(100), -- NULL means applies to all
  quotation_type VARCHAR(20), -- STANDARD, NON_STANDARD, null for both
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quotation_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) NOT NULL,
  terms_id UUID REFERENCES terms_conditions(id),
  
  custom_text TEXT, -- If user edited the default text
  display_order INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link customer defaults
ALTER TABLE customers ADD COLUMN default_terms_set UUID[];
```

**Seed Default T&C:**
```sql
INSERT INTO terms_conditions (category, title, description, is_default) VALUES
('PAYMENT', 'Payment Terms', '100% advance payment against Proforma Invoice', true),
('DELIVERY', 'Delivery', 'Ex-Works Mumbai. Freight extra as applicable', true),
('VALIDITY', 'Offer Validity', 'This quotation is valid for 15 days from date of issue', true),
('INSPECTION', 'Inspection', 'Third party inspection acceptable at buyer cost', true),
('WARRANTY', 'Warranty', 'Material covered under mill warranty only', true),
('GST', 'GST', 'GST extra as applicable. Current rate 18%', true),
('DEVIATION', 'Technical Deviation', 'Subject to technical approval by buyer', false);
```

**UI Requirements:**
- Terms & Conditions Master (/masters/terms-conditions)
- Checkbox list in quotation form
- Edit icon to customize text per quotation
- Drag-drop to reorder
- Customer default T&C set configuration

**Effort:** 3 days

---

### Gap 10: Unit of Measure Master
**Status:** ❌ 0% - Likely hardcoded  
**Impact:** Cannot add new units, no conversions  
**Priority:** 🟡 MEDIUM

**Database Schema:**
```sql
CREATE TABLE units_of_measure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50) NOT NULL, -- WEIGHT, LENGTH, QUANTITY, VOLUME, AREA
  
  -- For conversions (future)
  base_unit VARCHAR(20),
  conversion_factor DECIMAL(15,6),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed standard units
INSERT INTO units_of_measure (code, name, unit_type) VALUES
('KG', 'Kilogram', 'WEIGHT'),
('MT', 'Metric Ton', 'WEIGHT'),
('PC', 'Piece', 'QUANTITY'),
('NO', 'Number', 'QUANTITY'),
('MTR', 'Meter', 'LENGTH'),
('FT', 'Feet', 'LENGTH'),
('MM', 'Millimeter', 'LENGTH'),
('IN', 'Inch', 'LENGTH'),
('SQM', 'Square Meter', 'AREA'),
('CUM', 'Cubic Meter', 'VOLUME'),
('LTR', 'Liter', 'VOLUME');

-- Update existing tables
ALTER TABLE products ADD COLUMN primary_uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE quotation_items ADD COLUMN uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE sales_order_items ADD COLUMN uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE purchase_order_items ADD COLUMN uom_id UUID REFERENCES units_of_measure(id);
ALTER TABLE inventory ADD COLUMN uom_id UUID REFERENCES units_of_measure(id);
```

**UI Requirements:**
- UOM Master page (simple CRUD)
- UOM dropdown in all item entry forms
- Unit conversion calculator (future phase)

**Effort:** 1 day

---

## PART 2: MASTER DATA IMPORT PLAN

### Import Task 1: Pipe Size Masters (271 rows)

**Source Files:**
1. PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx (80 rows) - SS & DS pipes
2. PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx (191 rows) - CS & AS pipes

**Import Script:**
```python
import pandas as pd
from supabase import create_client
import os

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

def import_pipe_sizes():
    # Import SS/DS Pipes
    ss_df = pd.read_excel('PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx')
    for _, row in ss_df.iterrows():
        material_type = 'SS'  # Stainless Steel
        data = {
            'material_type': material_type,
            'size_inch': str(row['Size \n(Inch)']),
            'od_mm': float(row['OD\n(mm)']),
            'schedule': str(row['Schedule']),
            'wall_thickness_mm': float(row['W.T.\n(mm)']),
            'weight_kg_per_m': float(row['Weight \n(kg/m)'])
        }
        supabase.table('pipe_sizes').insert(data).execute()
    
    # Import CS/AS Pipes
    cs_df = pd.read_excel('PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx')
    for _, row in cs_df.iterrows():
        material_type = 'CS'  # Carbon Steel
        data = {
            'material_type': material_type,
            'size_inch': str(row['Size \n(Inch)']),
            'od_mm': float(row['OD\n(mm)']),
            'schedule': str(row['Schedule']),
            'wall_thickness_mm': float(row['W.T.\n(mm)']),
            'weight_kg_per_m': float(row['Weight \n(kg/m)'])
        }
        supabase.table('pipe_sizes').insert(data).execute()
    
    print(f"Imported {len(ss_df) + len(cs_df)} pipe size records")

import_pipe_sizes()
```

**Verification:**
```sql
SELECT material_type, COUNT(*) 
FROM pipe_sizes 
GROUP BY material_type;

-- Expected: SS: 80, CS: 191
```

**Effort:** 0.5 days

---

### Import Task 2: Product Specifications (245 rows)

**Source File:** PRODUCT_SPEC_MASTER_-_1.xlsx

**Columns:**
- Product (C.S. SEAMLESS PIPE, S.S. SEAMLESS PIPE, etc.)
- Material (ASTM A106 GR.B, ASTM A312 TP 316L, etc.)
- Additional Spec (NACE MR0175, NACE MR0103, etc.)
- Ends (BE, PE, NPTM, etc.)
- Length (5.00 - 7.00, 9.00 - 11.80, etc.)

**Database Schema:**
```sql
CREATE TABLE product_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name VARCHAR(200) NOT NULL,
  material VARCHAR(200),
  additional_spec VARCHAR(500),
  ends VARCHAR(50),
  length_range VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Import Script:**
```python
def import_product_specs():
    df = pd.read_excel('PRODUCT_SPEC_MASTER_-_1.xlsx')
    for _, row in df.iterrows():
        if pd.notna(row['Product ']):  # Skip empty rows
            data = {
                'product_name': str(row['Product ']).strip(),
                'material': str(row['Material']) if pd.notna(row['Material']) else None,
                'additional_spec': str(row['Additional Spec']) if pd.notna(row['Additional Spec']) else None,
                'ends': str(row['Ends']) if pd.notna(row['Ends']) else None,
                'length_range': str(row['Length ']) if pd.notna(row['Length ']) else None
            }
            supabase.table('product_specifications').insert(data).execute()
    
    print(f"Imported {len(df)} product specification records")

import_product_specs()
```

**Usage:** Used in Standard Quotation dropdowns

**Effort:** 0.5 days

---

### Import Task 3: Testing Master (11 tests)

**Source File:** TESTING_MASTER_FOR_LAB_LETTER.xlsx

**Tests:**
1. Chemical Analysis
2. Mechanical Test
3. Flattening Test
4. Flaring Test
5. Macro Test for Seamless
6. Micro Test
7. IGC Practice 'E' Test
8. IGC Practice 'E' Test With 20X - 250X Mag
9. Hardness Test
10. Impact Test
11. Bend Test

**Database Schema:**
```sql
CREATE TABLE qc_test_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name VARCHAR(200) NOT NULL,
  test_code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Import Script:**
```python
def import_testing_master():
    df = pd.read_excel('TESTING_MASTER_FOR_LAB_LETTER.xlsx')
    for idx, row in df.iterrows():
        data = {
            'test_name': str(row['Testing to be performed']),
            'test_code': f'TEST{idx+1:03d}'
        }
        supabase.table('qc_test_types').insert(data).execute()
    
    print(f"Imported {len(df)} QC test types")

import_testing_master()
```

**Usage:** 
- QC inspection checklist
- Lab letter generation
- MTC requirements

**Effort:** 0.25 days

---

## PART 3: 8-WEEK IMPLEMENTATION TIMELINE

### Week 1: Foundation & Masters (Days 1-7)

**Sprint Goal:** Build foundational master tables and data

**Day 1-2: Company Master**
- [ ] Create companies table
- [ ] Build Company Master CRUD UI
- [ ] Add company_id to all transactional tables
- [ ] Implement company selection in user session
- [ ] Test: Create 2 companies, ensure data isolation

**Day 3-4: Employee Master**
- [ ] Create employees table
- [ ] Build Employee Master UI
- [ ] Link employees to auth.users
- [ ] Department assignment
- [ ] Test: Create 5 employees across departments

**Day 5-7: Buyer Master & Customer Enhancement**
- [ ] Create buyers table
- [ ] Build Buyer Master UI
- [ ] Link buyers to customers
- [ ] Add opening_balance to customers
- [ ] Create customer_dispatch_addresses table
- [ ] Build dispatch address management UI
- [ ] Test: 3 buyers per customer, multiple addresses

**Deliverable:** All master tables functional, ready for data entry

---

### Week 2: Master Data Import & Unit Master (Days 8-14)

**Sprint Goal:** Import all Excel data and complete masters

**Day 8-9: Unit of Measure**
- [ ] Create units_of_measure table
- [ ] Seed standard units (Kg, MT, PC, MTR, etc.)
- [ ] Build UOM Master UI
- [ ] Update product/quotation/order tables with uom_id
- [ ] Test: Create quotation using different units

**Day 10-11: Pipe Size Master Import**
- [ ] Create pipe_sizes table
- [ ] Write import script
- [ ] Import SS/DS pipes (80 rows)
- [ ] Import CS/AS pipes (191 rows)
- [ ] Verify data integrity
- [ ] Build Pipe Size Master UI (read-only initially)

**Day 12-13: Product Spec & Testing Import**
- [ ] Create product_specifications table
- [ ] Import 245 product specs
- [ ] Create qc_test_types table
- [ ] Import 11 test types
- [ ] Build UI for browsing imported data

**Day 14: Week Review & Testing**
- [ ] Test all master CRUD operations
- [ ] Verify data imports
- [ ] Fix any bugs
- [ ] Documentation update

**Deliverable:** All 271 rows of master data imported and accessible

---

### Week 3: Quotation Versioning & Dual Formats (Days 15-21)

**Sprint Goal:** Redesign quotation system with versioning and dual formats

**Day 15-16: Quotation Versioning**
- [ ] Add version_number, parent_quotation_id to quotations
- [ ] Create version increment trigger
- [ ] Build "Create Revision" functionality
- [ ] Version history UI
- [ ] Revision comparison view
- [ ] Test: Create Rev.01, Rev.02, Rev.03

**Day 17-19: Dual Quotation Formats**
- [ ] Add quotation_type to quotations
- [ ] Update quotation_items for pipe_size_id
- [ ] Build Standard Quotation UI:
  - Material type dropdown
  - Size dropdown (from pipe_sizes)
  - Schedule dropdown
  - Auto weight calculation
- [ ] Build Non-Standard Quotation UI:
  - Free-text description
  - Manual quantity/unit entry
- [ ] Test both flows end-to-end

**Day 20-21: Material Code Auto-Generation**
- [ ] Add internal_material_code to products
- [ ] Create material_code_sequences table
- [ ] Build auto-generation function
- [ ] Create product_pricing_history table
- [ ] Pricing history trigger
- [ ] Test: Auto-generate codes for 10 products
- [ ] Verify pricing history population

**Deliverable:** Quotation system redesigned and functional

---

### Week 4: Terms & Conditions + PDF Generation Prep (Days 22-28)

**Sprint Goal:** T&C management and PDF template setup

**Day 22-24: Terms & Conditions**
- [ ] Create terms_conditions table
- [ ] Create quotation_terms table
- [ ] Seed default T&C (7-10 common terms)
- [ ] Build T&C Master UI
- [ ] Build T&C selection in quotation form (checkboxes)
- [ ] Custom text editing
- [ ] Test: Create quotation with custom T&C

**Day 25-26: PDF Library Setup**
- [ ] Install @react-pdf/renderer
- [ ] Create PDF template structure
- [ ] Design standard quotation template (match PIPES_QUOTATION_FORMAT.xlsx)
- [ ] Design export quotation template (match EXPORT_QUOTATION_FORMAT-1.xlsx)
- [ ] Test: Render simple PDF with company header

**Day 27-28: PDF API Routes**
- [ ] Create /api/quotations/[id]/pdf route
- [ ] Fetch quotation with all relations
- [ ] Render PDF with showPrice parameter
- [ ] Store in Supabase Storage
- [ ] Return PDF download
- [ ] Test: Generate PDF with and without prices

**Deliverable:** T&C system working, PDF generation foundation ready

---

### Week 5: Complete PDF Templates (Days 29-35)

**Sprint Goal:** Build all PDF templates

**Day 29-31: Quotation PDF Templates**
- [ ] Complete Standard Quotation PDF
  - Company header with logo
  - Customer details
  - Item table with pipe specs
  - T&C section
  - Signature blocks
- [ ] Complete Non-Standard/Export PDF
  - Different layout per EXPORT_QUOTATION_FORMAT
  - Commercial and Technical sheets
- [ ] Version display (Rev.01, Rev.02)
- [ ] With/Without price logic
- [ ] Test: Generate 5 different quotations

**Day 32: Other Document Templates**
- [ ] Sales Order PDF
- [ ] Purchase Order PDF
- [ ] Packing List PDF
- [ ] Dispatch Note PDF

**Day 33-34: Invoice PDF (GST Compliant)**
- [ ] Invoice header with GSTIN
- [ ] Item table with HSN codes
- [ ] Tax breakup (CGST, SGST, IGST)
- [ ] Bank details
- [ ] Digital signature space
- [ ] Test: Generate GST invoice

**Day 35: PDF UI Integration**
- [ ] "Print" button on quotation view
- [ ] Dropdown: With Price / Without Price
- [ ] PDF preview modal
- [ ] Download and open in new tab
- [ ] Test: Print all document types

**Deliverable:** Complete PDF generation for all documents

---

### Week 6: Inventory Enhancements & Order Tracking (Days 36-42)

**Sprint Goal:** Inventory dashboard and order status tracking

**Day 36-37: Inventory Dashboard**
- [ ] Create inventory dashboard page
- [ ] Summary cards (total value, under QC, accepted, rejected)
- [ ] Advanced filters:
  - Form (CS, SS, AS, DS)
  - Type (SMLS, Welded)
  - Heat number search
  - Location/Rack
  - QC Status
- [ ] Color-coded table (green/yellow/red)
- [ ] Quick actions (View MTC, Update Location, Dispatch)
- [ ] Match INVENTORY_MASTER_-_LATEST.xlsx layout
- [ ] Test: Filter inventory by various criteria

**Day 38-40: Order Status Tracking**
- [ ] Add status to sales_order_items
- [ ] Create item_status_history table
- [ ] Define status states:
  - SO_CONFIRMED → PO_PLACED → MATERIAL_RECEIVED → 
  - UNDER_QC → QC_ACCEPTED → READY_TO_DISPATCH → 
  - DISPATCHED → INVOICED → PAID
- [ ] Build Order Tracking page with timeline
- [ ] Search by PO number, product code, heat number
- [ ] Status update functionality
- [ ] Automated status progression triggers
- [ ] Test: Track order through all stages

**Day 41-42: Warehouse/Rack Hierarchy**
- [ ] Enhance Stock Location Master
- [ ] Warehouse table (if multi-warehouse)
- [ ] Rack/Bin location hierarchy
- [ ] Location assignment in GRN
- [ ] Location search and filtering
- [ ] Test: Assign materials to racks, search by location

**Deliverable:** Enhanced inventory visibility and order tracking

---

### Week 7: Integration & Testing (Days 43-49)

**Sprint Goal:** End-to-end testing and bug fixes

**Day 43-44: Complete Flow Testing**
- [ ] Test: Enquiry → Quotation (Rev.01) → Revision (Rev.02) → Approval
- [ ] Test: Sales Order → PO → GRN → QC → Dispatch → Invoice → Payment
- [ ] Test: Standard quotation with pipe sizes, auto weight calc
- [ ] Test: Non-standard quotation with free text
- [ ] Test: PDF generation for all document types
- [ ] Test: Buyer performance reports
- [ ] Test: Material code auto-generation
- [ ] Test: Pricing history tracking

**Day 45-46: Multi-Company Testing**
- [ ] Create 2 companies
- [ ] Test data isolation
- [ ] Company-specific quotation headers
- [ ] Different GSTIN per company
- [ ] Verify no data leakage between companies

**Day 47: ISO 9001 Compliance Verification**
- [ ] Test quotation versioning (Clause 7.5.2)
- [ ] Test MTC linkage (Clause 7.5.3)
- [ ] Test vendor approval (Clause 8.4)
- [ ] Test QC inspection (Clause 8.6)
- [ ] Test NCR (Clause 8.7)
- [ ] Test audit trail (all clauses)
- [ ] Generate ISO compliance report

**Day 48-49: Bug Fixes**
- [ ] Fix all critical bugs from testing
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Mobile responsiveness check

**Deliverable:** All features tested and bugs fixed

---

### Week 8: UAT, Training & Deployment (Days 50-56)

**Sprint Goal:** Client UAT, training, and production deployment

**Day 50-51: UAT Preparation**
- [ ] Prepare UAT environment
- [ ] Create test data set
- [ ] Prepare UAT checklist (based on Karan's 12 points)
- [ ] Create user training materials
- [ ] Record video tutorials for each module

**Day 52-53: Client UAT**
- [ ] Conduct UAT with Karan Patil and Uttam Sir
- [ ] Test Karan's 12 critical points:
  1. ISO compliance
  2. Opening balance tracking
  3. Multiple office addresses
  4. Quotation versioning
  5. Buyer-wise business analysis
  6. Material code system
  7. Standard vs Non-standard quotations
  8. Print with/without price
  9. Dynamic T&C
  10. Unique quotation numbers
  11. Inventory glance view
  12. Order status tracking
- [ ] Collect feedback
- [ ] Create issue list

**Day 54: Post-UAT Fixes**
- [ ] Fix all UAT issues
- [ ] Re-test critical flows
- [ ] Get client sign-off

**Day 55: Training**
- [ ] Train sales team on enquiry/quotation
- [ ] Train purchase team on PO management
- [ ] Train QC team on inspection/MTC
- [ ] Train accounts team on invoice/payment
- [ ] Train management on MIS reports

**Day 56: Production Deployment**
- [ ] Final database backup
- [ ] Deploy to production
- [ ] Import live data:
  - Companies
  - Employees
  - Customers (with buyers)
  - Vendors
  - Products (with material codes)
  - Terms & Conditions
- [ ] Smoke testing on production
- [ ] Go-live celebration! 🎉

**Deliverable:** Production-ready system deployed

---

## PART 4: RESOURCE REQUIREMENTS

### Development Team
- **1 Full-Stack Developer** (You)
- **Optional:** 1 Junior Developer for testing support

### Time Commitment
- **8 weeks @ 40 hours/week = 320 hours**
- **Recommended:** 50 hours/week for 8 weeks (buffer for unknowns)

### Infrastructure
- Supabase account (current setup sufficient)
- Vercel deployment (current setup sufficient)
- **New:** Supabase Storage for PDF documents (set up in Week 4)

### Client Involvement Required
- **Week 1:** Company details, employee list
- **Week 2:** Review masters after import
- **Week 3:** Review quotation templates
- **Week 5:** Approve PDF designs
- **Week 8:** Full UAT participation (2-3 days)

---

## PART 5: RISK MITIGATION

### Risk 1: Client Changes Requirements Mid-Sprint
**Mitigation:**
- Weekly demos every Friday
- Get sign-off on each major feature before moving forward
- Change request process for new requirements

### Risk 2: Excel Import Data Quality Issues
**Mitigation:**
- Week 2 dedicated to imports with validation
- Show client imported data early for verification
- Keep original Excel files as backup

### Risk 3: PDF Templates Don't Match Client Expectations
**Mitigation:**
- Create draft PDF in Week 4, get approval before Week 5
- Use actual client Excel templates as reference
- Multiple review cycles

### Risk 4: Performance Issues with Large Data
**Mitigation:**
- Implement pagination early
- Add database indexes
- Test with 1000+ records
- Use Supabase query optimization

### Risk 5: Timeline Overrun
**Mitigation:**
- Buffer time built into each week
- Prioritize Phase 1 features only
- Move nice-to-haves to Phase 2
- Daily progress tracking

---

## PART 6: SUCCESS CRITERIA

### Phase 1 Completion Checklist

**Masters (10 items):**
- [x] Company Master with multi-company support
- [x] Employee Master with department mapping
- [x] Buyer Master with performance tracking
- [x] Customer with opening balance & dispatch addresses
- [x] Unit of Measure Master
- [x] Terms & Conditions Master
- [x] Pipe Size Master (271 rows imported)
- [x] Product Spec Master (245 rows imported)
- [x] QC Test Types (11 tests imported)
- [x] Material Code auto-generation

**Quotation System (5 items):**
- [x] Quotation versioning (Rev.01, Rev.02...)
- [x] Standard quotation (pipe dropdowns, auto calculations)
- [x] Non-standard quotation (free text)
- [x] Dynamic T&C selection
- [x] PDF generation (with/without price)

**Tracking & Reporting (3 items):**
- [x] Buyer performance reports
- [x] Order status tracking (product-by-product)
- [x] Inventory dashboard (glance view)

**Karan's 12 Points:**
1. [x] ISO compliance (versioning, audit trail)
2. [x] Opening balance per buyer
3. [x] Office address per GSTIN
4. [x] Quotation versioning
5. [x] Buyer-wise business data
6. [x] Material codes (dual system)
7. [x] Standard vs Non-standard quotations
8. [x] Print with/without price
9. [x] Dynamic T&C
10. [x] Unique quotation numbers (already done)
11. [x] Inventory glance view
12. [x] Order status tracking

**ISO 9001 Compliance:**
- [x] Clause 7.5.2 - Document revision control
- [x] Clause 7.5.3 - Document traceability
- [x] Clause 8.2 - Customer communication (buyer linkage)
- [x] Clause 8.4 - Vendor control
- [x] Clause 8.5.2 - Heat number traceability
- [x] Clause 8.6 - QC release
- [x] Clause 8.7 - NCR
- [x] Clause 9.1 - MIS reports

---

## PART 7: POST-IMPLEMENTATION (Phase 2)

### Immediate After Go-Live (Weeks 9-10)
- Bug fixes from production use
- Performance optimization
- User feedback incorporation

### Phase 2 Features (Months 2-3)
- Email integration (send quotations/POs/invoices)
- Barcode/QR code for inventory
- E-way bill generation
- Advanced analytics dashboard
- Multi-warehouse support
- TDS and bank reconciliation

### Long-Term (Months 4-6)
- Mobile app
- Offline support
- API for third-party integrations
- Advanced workflow automation
- Machine learning for price prediction

---

## PART 8: DAILY STANDUPS & WEEKLY REVIEWS

### Daily Standup (15 minutes)
- What did I complete yesterday?
- What will I complete today?
- Any blockers?

### Weekly Review (Friday 2pm)
- Demo completed features to client
- Review week's progress against plan
- Adjust next week's tasks if needed
- Client feedback and sign-off

### Weekly Schedule Template

**Monday-Thursday:** Deep work, feature development  
**Friday Morning:** Testing, bug fixes  
**Friday Afternoon:** Client demo and review  

---

## CONCLUSION

This is your **complete roadmap** to transform your 60% complete ERP into a 100% production-ready system in 8 weeks.

**Key Success Factors:**
1. **Follow the timeline strictly** - Each week builds on the previous
2. **Import master data early** - Week 2 is critical for Weeks 3-8
3. **Get client approval on PDFs** - Week 5 depends on Week 4 approval
4. **Test continuously** - Don't leave testing to Week 7
5. **Use the Excel files** - They're your design templates

**The Path Forward:**
- Start Monday Week 1 with Company Master
- By Friday Week 2, you'll have all 271 rows imported
- By Friday Week 5, you'll have PDF generation working
- By Friday Week 8, you'll be in production

**You have everything you need:**
- ✅ Solid architecture (75% of screens done)
- ✅ All Excel master files (271 rows ready)
- ✅ Clear requirements documents
- ✅ This detailed 8-week plan

**Now execute!** 🚀

---

END OF IMPLEMENTATION PLAN

**Document Version:** 1.0  
**Created:** January 30, 2026  
**Total Pages:** 47  
**Estimated Read Time:** 90 minutes  
**Estimated Implementation Time:** 8 weeks (320-400 hours)
