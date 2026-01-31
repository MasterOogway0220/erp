# COMPLETE MASTER DATA INVENTORY
## SteelERP - All Master Tables & Data

---

## EXECUTIVE SUMMARY

**Total Master Tables Required:** 15  
**Currently Built:** 3 (Customers, Vendors, Products - basic)  
**Missing:** 12  
**Excel Data Available for Import:** 527+ rows across 4 files

---

## PART 1: MASTER DATA YOU HAVE (Built in Current System)

### 1. ✅ CUSTOMERS MASTER
**Status:** Built but incomplete  
**Location:** `customers` table in database

**Current Fields:**
```sql
customers:
  - id
  - name
  - email
  - phone
  - address
  - city
  - state
  - pin
  - gstin
  - credit_limit
  - created_at
```

**What's Missing:**
- ❌ company_id (for multi-company)
- ❌ opening_balance
- ❌ opening_balance_date
- ❌ default_terms_id
- ❌ customer_material_code_prefix
- ❌ payment_terms
- ❌ delivery_terms
- ❌ is_active flag

**Sample Data:** 5 customers (Reliance, ONGC, Aramco, BPCL, IOCL)

**Completion:** 50% - Basic structure exists, needs enhancements

---

### 2. ✅ VENDORS MASTER
**Status:** Built but incomplete  
**Location:** `vendors` table in database

**Current Fields:**
```sql
vendors:
  - id
  - name
  - email
  - phone
  - address
  - city
  - state
  - pin
  - gstin
  - approval_status (PENDING, APPROVED, REJECTED)
  - created_at
```

**What's Missing:**
- ❌ company_id
- ❌ opening_balance
- ❌ vendor_code
- ❌ contact_person
- ❌ payment_terms
- ❌ delivery_lead_time
- ❌ quality_rating
- ❌ vendor_category (DOMESTIC, IMPORT)

**Sample Data:** 5 vendors (Tata Steel, JSW, Jindal, SAIL, Vedanta)

**Completion:** 60% - Good structure, needs enhancements

---

### 3. ✅ PRODUCTS MASTER
**Status:** Built but VERY incomplete  
**Location:** `products` table in database

**Current Fields:**
```sql
products:
  - id
  - product_code
  - name
  - category
  - hsn_code
  - unit (likely hardcoded string)
  - created_at
```

**What's CRITICALLY Missing:**
- ❌ company_id
- ❌ internal_material_code (auto-generated)
- ❌ customer_material_code
- ❌ auto_code_sequence
- ❌ category_code
- ❌ primary_uom_id (foreign key to UOM table)
- ❌ weight_per_unit
- ❌ specifications
- ❌ material_grade
- ❌ standard (ASTM, API, etc.)
- ❌ manufacturer
- ❌ is_active flag

**Sample Data:** ~10 products (pipes, flanges, valves, gaskets)

**Completion:** 30% - Exists but missing critical fields

---

## PART 2: MASTER DATA YOU DON'T HAVE (Critical Gaps)

### 4. ❌ COMPANIES MASTER (CRITICAL BLOCKER)
**Status:** Does NOT exist  
**Priority:** 🚨 CRITICAL - Everything depends on this

**Required Fields:**
```sql
companies:
  - id UUID PRIMARY KEY
  - company_type VARCHAR(50)        -- Proprietorship, Partnership, LLP, etc.
  - company_name VARCHAR(200)
  - legal_name VARCHAR(200)
  
  -- Registered Address
  - reg_address_line1 VARCHAR(200)
  - reg_address_line2 VARCHAR(200)
  - reg_city VARCHAR(100)
  - reg_pin VARCHAR(20)
  - reg_state VARCHAR(100)
  - reg_country VARCHAR(100)
  
  -- Warehouse Address
  - wh_address_line1 VARCHAR(200)
  - wh_address_line2 VARCHAR(200)
  - wh_city VARCHAR(100)
  - wh_pin VARCHAR(20)
  - wh_state VARCHAR(100)
  - wh_country VARCHAR(100)
  
  -- Tax & Legal
  - pan VARCHAR(20)
  - tan VARCHAR(20)
  - gstin VARCHAR(20)
  - cin VARCHAR(50)
  
  -- Contact
  - phone VARCHAR(50)
  - email VARCHAR(200)
  - website VARCHAR(200)
  
  -- Financial Year
  - fy_start_month INTEGER
  - fy_end_month INTEGER
  
  -- Metadata
  - logo_url TEXT
  - is_active BOOLEAN
  - created_at TIMESTAMP
  - updated_at TIMESTAMP
```

**Sample Data to Create:** 1-2 companies (client's own companies)

**Impact:** Cannot generate quotations/invoices without this

---

### 5. ❌ EMPLOYEES MASTER (HIGH PRIORITY)
**Status:** Partially exists (auth.users only)  
**Priority:** 🔴 HIGH

**Current:** You have `auth.users` with basic authentication  
**Missing:** Employee profile, department, designation

**Required Fields:**
```sql
employees:
  - id UUID PRIMARY KEY
  - user_id UUID REFERENCES auth.users(id)
  - company_id UUID REFERENCES companies(id)
  
  - employee_code VARCHAR(50)
  - full_name VARCHAR(200)
  - department VARCHAR(50)          -- PURCHASE, SALES, QUALITY, WAREHOUSE, ACCOUNTS
  - designation VARCHAR(200)
  
  - email VARCHAR(200)
  - mobile VARCHAR(50)
  - phone VARCHAR(50)
  
  - reporting_manager_id UUID REFERENCES employees(id)
  
  - date_of_joining DATE
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data to Create:** 5-10 employees from client

**Impact:** No department mapping, no employee reports

---

### 6. ❌ BUYERS MASTER (CRITICAL)
**Status:** Does NOT exist  
**Priority:** 🚨 CRITICAL - Karan's #1 requirement

**Required Fields:**
```sql
buyers:
  - id UUID PRIMARY KEY
  - customer_id UUID REFERENCES customers(id)
  
  - buyer_name VARCHAR(200)
  - designation VARCHAR(200)
  - email VARCHAR(200)
  - mobile VARCHAR(50)
  - phone VARCHAR(50)
  
  - is_primary_contact BOOLEAN
  - is_active BOOLEAN
  
  -- Performance metrics (auto-calculated)
  - total_enquiries INTEGER
  - total_quotations INTEGER
  - total_orders INTEGER
  - total_order_value DECIMAL(15,2)
  - conversion_rate DECIMAL(5,2)
  
  - created_at TIMESTAMP
```

**Sample Data to Create:** 10-15 buyers across 5 customers (2-3 buyers per customer)

**Impact:** Cannot track "which buyer gives best business"

---

### 7. ❌ CUSTOMER DISPATCH ADDRESSES (HIGH PRIORITY)
**Status:** Does NOT exist  
**Priority:** 🔴 HIGH

**Required Fields:**
```sql
customer_dispatch_addresses:
  - id UUID PRIMARY KEY
  - customer_id UUID REFERENCES customers(id)
  
  - address_type VARCHAR(50)        -- BILLING, SHIPPING, CONSIGNEE
  - company_name VARCHAR(200)
  - contact_person VARCHAR(200)
  
  - address_line1 VARCHAR(200)
  - address_line2 VARCHAR(200)
  - city VARCHAR(100)
  - pin VARCHAR(20)
  - state VARCHAR(100)
  - country VARCHAR(100)
  
  - gstin VARCHAR(20)
  - phone VARCHAR(50)
  - email VARCHAR(200)
  
  - is_default BOOLEAN
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data to Create:** 5-10 dispatch addresses for existing customers

**Impact:** Cannot generate proper invoices with buyer/consignee details

---

### 8. ❌ UNITS OF MEASURE MASTER (MEDIUM PRIORITY)
**Status:** Does NOT exist (likely hardcoded in code)  
**Priority:** 🟡 MEDIUM

**Required Fields:**
```sql
units_of_measure:
  - id UUID PRIMARY KEY
  - code VARCHAR(20) UNIQUE         -- KG, MT, PC, MTR, FT, MM, IN
  - name VARCHAR(100)               -- Kilogram, Metric Ton, Piece, etc.
  - unit_type VARCHAR(50)           -- WEIGHT, LENGTH, QUANTITY, VOLUME, AREA
  
  -- For future conversions
  - base_unit VARCHAR(20)
  - conversion_factor DECIMAL(15,6)
  
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data to Create:**
```
Code  | Name           | Type
------|----------------|----------
KG    | Kilogram       | WEIGHT
MT    | Metric Ton     | WEIGHT
PC    | Piece          | QUANTITY
NO    | Number         | QUANTITY
MTR   | Meter          | LENGTH
FT    | Feet           | LENGTH
MM    | Millimeter     | LENGTH
IN    | Inch           | LENGTH
SQM   | Square Meter   | AREA
CUM   | Cubic Meter    | VOLUME
LTR   | Liter          | VOLUME
```

**Total Rows:** 11 units

**Impact:** Cannot dynamically add new units, hardcoded units in multiple places

---

### 9. ❌ TERMS & CONDITIONS MASTER (MEDIUM PRIORITY)
**Status:** Does NOT exist  
**Priority:** 🟡 MEDIUM

**Required Fields:**
```sql
terms_conditions:
  - id UUID PRIMARY KEY
  - company_id UUID REFERENCES companies(id)
  
  - category VARCHAR(100)           -- PAYMENT, DELIVERY, WARRANTY, INSPECTION, GENERAL
  - title VARCHAR(200)
  - description TEXT
  
  - is_default BOOLEAN
  - product_category VARCHAR(100)   -- NULL = applies to all
  - quotation_type VARCHAR(20)      -- STANDARD, NON_STANDARD, null = both
  
  - display_order INTEGER
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data to Create:**
```
Category    | Title                | Description
------------|----------------------|----------------------------------
PAYMENT     | Payment Terms        | 100% advance against PI
DELIVERY    | Delivery Terms       | Ex-Works Mumbai
VALIDITY    | Offer Validity       | 15 days from date of issue
INSPECTION  | Inspection           | Third party inspection at buyer cost
WARRANTY    | Warranty             | Mill warranty only
GST         | GST                  | GST extra as applicable (18%)
PACKAGING   | Packaging            | Standard export packing
FREIGHT     | Freight              | Freight extra as applicable
```

**Total Rows:** 8-10 standard terms

**Impact:** Cannot customize T&C per quotation

---

## PART 3: MASTER DATA FROM EXCEL FILES (Ready to Import)

### 10. ✅ PIPE SIZES MASTER (271 rows ready)
**Status:** Ready to import from Excel  
**Priority:** 🚨 CRITICAL for Standard Quotations

**Source Files:**
1. **PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx** (80 rows)
2. **PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx** (191 rows)

**Required Fields:**
```sql
pipe_sizes:
  - id UUID PRIMARY KEY
  - material_type VARCHAR(10)       -- SS, DS, CS, AS
  - size_inch VARCHAR(20)           -- 1/2", 3/4", 1", 2", 4", 6", etc.
  - od_mm DECIMAL(10,2)             -- Outside Diameter in mm
  - schedule VARCHAR(20)            -- SCH 5S, SCH 10, SCH 40, SCH 80, etc.
  - wall_thickness_mm DECIMAL(10,3) -- Wall thickness in mm
  - weight_kg_per_m DECIMAL(10,4)   -- Weight per meter in kg
  
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data (from Excel):**
```
Material | Size  | OD(mm) | Schedule | WT(mm) | Weight(kg/m)
---------|-------|--------|----------|--------|-------------
SS       | 1/2"  | 21.3   | Sch 5S   | 1.65   | 0.8108
SS       | 1/2"  | 21.3   | Sch 10S  | 2.11   | 1.0125
SS       | 4"    | 114.3  | Sch 40S  | 6.02   | 16.0700
CS       | 1/2"  | 21.3   | Sch 10   | 2.11   | 0.9986
CS       | 4"    | 114.3  | Sch 40   | 6.02   | 16.0700
```

**Total Rows:** 271 (80 SS/DS + 191 CS/AS)

**Usage:** 
- Dropdown in Standard Quotation
- Auto-fill OD, WT, Weight
- Auto-calculate total weight

**Import Script:** Python script provided in implementation plan

---

### 11. ✅ PRODUCT SPECIFICATIONS MASTER (245 rows ready)
**Status:** Ready to import from Excel  
**Priority:** 🟡 MEDIUM

**Source File:** PRODUCT_SPEC_MASTER_-_1.xlsx

**Required Fields:**
```sql
product_specifications:
  - id UUID PRIMARY KEY
  - product_name VARCHAR(200)       -- C.S. SEAMLESS PIPE, S.S. SEAMLESS PIPE
  - material VARCHAR(200)           -- ASTM A106 GR.B, ASTM A312 TP 316L
  - additional_spec VARCHAR(500)    -- NACE MR0175, NACE MR0103
  - ends VARCHAR(50)                -- BE, PE, NPTM
  - length_range VARCHAR(50)        -- 5.00 - 7.00, 9.00 - 11.80
  
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data (from Excel):**
```
Product             | Material          | Additional Spec  | Ends | Length
--------------------|-------------------|------------------|------|----------
C.S. SEAMLESS PIPE  | ASTM A106 GR.B    | NACE MR0175      | BE   | 5.00-7.00
C.S. SEAMLESS PIPE  | ASTM A53 GR.B     | NACE MR0103      | PE   | 9.00-11.80
S.S. SEAMLESS PIPE  | ASTM A312 TP 316L | IGC Practice E   | BE   | 5.50-6.50
```

**Total Rows:** 245

**Usage:** 
- Dropdown in Standard Quotation for specifications
- Pre-defined material grades and standards

**Import Script:** Python script provided in implementation plan

---

### 12. ✅ QC TEST TYPES MASTER (11 rows ready)
**Status:** Ready to import from Excel  
**Priority:** 🟡 MEDIUM

**Source File:** TESTING_MASTER_FOR_LAB_LETTER.xlsx

**Required Fields:**
```sql
qc_test_types:
  - id UUID PRIMARY KEY
  - test_name VARCHAR(200)
  - test_code VARCHAR(50)
  - description TEXT
  - is_mandatory BOOLEAN
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data (from Excel):**
```
Test Code | Test Name
----------|------------------------------------
TEST001   | Chemical Analysis
TEST002   | Mechanical Test
TEST003   | Flattening Test
TEST004   | Flaring Test
TEST005   | Macro Test for Seamless
TEST006   | Micro Test
TEST007   | IGC Practice 'E' Test
TEST008   | IGC Practice 'E' Test With 20X - 250X Mag
TEST009   | Hardness Test
TEST010   | Impact Test
TEST011   | Bend Test
```

**Total Rows:** 11

**Usage:** 
- QC inspection checklist
- Lab letter generation
- MTC requirements

**Import Script:** Simple INSERT statements

---

### 13. ✅ INVENTORY REFERENCE DATA
**Status:** Excel file for structure reference (not master data)  
**Priority:** 📊 REFERENCE ONLY

**Source File:** INVENTORY_MASTER_-_LATEST.xlsx

**Purpose:** Shows desired inventory structure and fields

**Columns:**
```
- Form (CS, SS, AS, DS)
- Type (SMLS, Welded)
- Specification
- Additional
- Dimension
- Size
- Ends
- Length
- Heat No.
- Make
- Quantity (Mtr.)
- Piece
- MTC No.
- MTC Date
- MTC Type
- Location
- TPI
- Notes
```

**Usage:** Reference for building inventory dashboard UI

---

## PART 4: SUPPORTING MASTER DATA (Nice to Have)

### 14. ⚪ TAX MASTER
**Status:** Not explicitly required but useful  
**Priority:** 🟢 LOW

**Required Fields:**
```sql
tax_master:
  - id UUID PRIMARY KEY
  - tax_type VARCHAR(50)            -- GST, IGST, CGST, SGST
  - tax_name VARCHAR(100)
  - tax_rate DECIMAL(5,2)           -- 18.00, 5.00, 12.00
  - hsn_code VARCHAR(20)
  - is_active BOOLEAN
  - effective_from DATE
  - effective_to DATE
  - created_at TIMESTAMP
```

**Sample Data:**
```
Tax Type | Rate  | Description
---------|-------|---------------------------
CGST     | 9.00  | Central GST
SGST     | 9.00  | State GST
IGST     | 18.00 | Integrated GST (Inter-state)
```

**Total Rows:** 3-5

**Usage:** GST calculation in invoices

---

### 15. ⚪ INSPECTION AGENCY MASTER
**Status:** Not explicitly required  
**Priority:** 🟢 LOW

**Required Fields:**
```sql
inspection_agencies:
  - id UUID PRIMARY KEY
  - agency_name VARCHAR(200)
  - agency_code VARCHAR(50)
  - contact_person VARCHAR(200)
  - email VARCHAR(200)
  - phone VARCHAR(50)
  - address TEXT
  - is_active BOOLEAN
  - created_at TIMESTAMP
```

**Sample Data:**
```
Code | Name                              | Contact
-----|-----------------------------------|----------
BVIS | Bureau Veritas Inspection Services| contact@bvis.com
SGS  | SGS India Pvt Ltd                 | info@sgs.com
TUV  | TUV Rheinland India               | inquiry@tuv.com
```

**Total Rows:** 3-5 agencies

**Usage:** Link to MTC and inspection reports

---

## SUMMARY TABLE: ALL MASTER DATA

| # | Master Table | Status | Priority | Rows | Source | Import Ready? |
|---|-------------|--------|----------|------|--------|---------------|
| 1 | Companies | ❌ Missing | 🚨 CRITICAL | 1-2 | Manual | No - Create |
| 2 | Employees | ⚠️ Partial | 🔴 HIGH | 5-10 | Manual | No - Create |
| 3 | Customers | ✅ Basic | 🔴 HIGH | 5 | Built | Enhance |
| 4 | Buyers | ❌ Missing | 🚨 CRITICAL | 10-15 | Manual | No - Create |
| 5 | Customer Addresses | ❌ Missing | 🔴 HIGH | 5-10 | Manual | No - Create |
| 6 | Vendors | ✅ Basic | 🟡 MEDIUM | 5 | Built | Enhance |
| 7 | Products | ✅ Basic | 🔴 HIGH | 10 | Built | Enhance |
| 8 | Units of Measure | ❌ Missing | 🟡 MEDIUM | 11 | Manual | Seed Data |
| 9 | Terms & Conditions | ❌ Missing | 🟡 MEDIUM | 8-10 | Manual | Seed Data |
| 10 | Pipe Sizes | ❌ Missing | 🚨 CRITICAL | 271 | Excel | ✅ YES |
| 11 | Product Specifications | ❌ Missing | 🟡 MEDIUM | 245 | Excel | ✅ YES |
| 12 | QC Test Types | ❌ Missing | 🟡 MEDIUM | 11 | Excel | ✅ YES |
| 13 | Tax Master | ⚪ Optional | 🟢 LOW | 3-5 | Manual | Seed Data |
| 14 | Inspection Agencies | ⚪ Optional | 🟢 LOW | 3-5 | Manual | Seed Data |
| 15 | Inventory (Reference) | 📊 Reference | - | - | Excel | Reference Only |

**TOTALS:**
- **Built (Basic):** 3 masters (Customers, Vendors, Products)
- **Missing (Critical):** 4 masters (Companies, Employees, Buyers, Pipe Sizes)
- **Missing (High):** 3 masters (Customer Addresses, UOM, Product Specs)
- **Missing (Medium):** 2 masters (Terms & Conditions, QC Test Types)
- **Optional:** 2 masters (Tax, Inspection Agencies)

**Ready to Import from Excel:** 527 rows (271 pipe sizes + 245 product specs + 11 test types)

---

## PART 5: IMMEDIATE ACTION ITEMS

### Week 1: Critical Masters (Must Build)

**Day 1-2: Companies Master**
- Create companies table
- Collect data from client (1-2 companies)
- Build CRUD UI
- Add company_id to all tables

**Day 3: Employees Master**
- Create employees table
- Collect employee list from client (5-10 employees)
- Link to auth.users
- Build CRUD UI

**Day 4-5: Buyers Master**
- Create buyers table
- Collect buyer list from client (10-15 buyers)
- Link to customers
- Build CRUD UI

### Week 2: Excel Data Import

**Day 1: Pipe Sizes Import**
- Create pipe_sizes table
- Run import script for 271 rows
- Verify data integrity
- Test dropdowns

**Day 2: Product Specs Import**
- Create product_specifications table
- Run import script for 245 rows
- Verify data
- Link to quotation logic

**Day 3: Other Masters**
- Create UOM table, seed 11 units
- Create QC test types, seed 11 tests
- Create terms_conditions, seed 8-10 terms

### Week 3: Enhancements

**Enhance existing masters:**
- Add missing fields to Customers
- Create customer_dispatch_addresses table
- Add missing fields to Vendors
- Add missing fields to Products
- Link everything with company_id

---

## PART 6: DATA COLLECTION CHECKLIST

**From Client (Karan/Uttam Sir):**

### Companies Data (1-2 companies)
```
□ Company Type
□ Company Name & Legal Name
□ Registered Address (full)
□ Warehouse Address (full)
□ PAN, TAN, GSTIN, CIN
□ Contact: Phone, Email, Website
□ Company Logo
□ Financial Year (April-March or other)
```

### Employees Data (5-10 employees)
```
□ Full Name
□ Department (Purchase/Sales/Quality/Warehouse/Accounts)
□ Designation
□ Email (for login)
□ Mobile, Phone
□ Reporting Manager
□ Date of Joining
```

### Buyers Data (10-15 buyers across customers)
```
For each buyer:
□ Customer Name (link to existing customer)
□ Buyer Name
□ Designation
□ Email
□ Mobile, Phone
□ Is Primary Contact?
```

### Customer Dispatch Addresses (5-10 addresses)
```
For each address:
□ Customer Name
□ Address Type (Billing/Shipping/Consignee)
□ Company Name (at dispatch location)
□ Contact Person
□ Full Address
□ GSTIN (if different from main)
□ Phone, Email
```

---

## CONCLUSION

**You have:**
- ✅ 3 basic masters built (Customers, Vendors, Products)
- ✅ 527 rows of Excel data ready to import
- ✅ Clear structure for all 15 masters

**You're missing:**
- ❌ 4 critical masters (Companies, Employees, Buyers, Pipe Sizes)
- ❌ 5 high-priority masters
- ❌ Field enhancements to existing 3 masters

**Total work:**
- Create: 9 new tables
- Import: 527 rows from Excel
- Enhance: 3 existing tables
- Collect: ~50 rows of data from client

**Timeline:** 2 weeks to complete all master data

**Start with:** Companies → Employees → Buyers → Pipe Sizes import

END OF MASTER DATA INVENTORY
