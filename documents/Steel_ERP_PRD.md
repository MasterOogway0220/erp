# PRODUCT REQUIREMENTS DOCUMENT
## Steel Pipe Trading ERP System
### Oil, Gas, Power & Petrochemical Industries

**Version:** 2.0  
**Date:** February 7, 2026  
**Status:** Final - Ready for Development  
**Stakeholders:** Karan Patil, Uttam Sir  
**ISO Compliance:** ISO 9001:2018

---

## DOCUMENT CONTROL

| Field | Value |
|-------|-------|
| Document Title | Steel Pipe Trading ERP - Product Requirements Document |
| Version | 2.0 |
| Date | February 7, 2026 |
| Author | Development Team |
| Stakeholder | Karan Patil, Uttam Sir |
| Status | Final - Ready for Development |

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Critical Requirements from Karan Patil](#3-critical-requirements-from-karan-patil)
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 [Authentication & Multi-Company Setup](#41-authentication--multi-company-setup)
   - 4.2 [Company Master](#42-company-master)
   - 4.3 [Employee Master](#43-employee-master)
   - 4.4 [Customer & Buyer Master](#44-customer--buyer-master)
   - 4.5 [Vendor Master](#45-vendor-master)
   - 4.6 [Product Master & Material Codes](#46-product-master--material-codes)
   - 4.7 [Quotation Management (MODULE 1 - PRIORITY)](#47-quotation-management-module-1---priority)
   - 4.8 [Sales Order Management](#48-sales-order-management)
   - 4.9 [Purchase Order Management](#49-purchase-order-management)
   - 4.10 [Inventory Management](#410-inventory-management)
   - 4.11 [Quality Control & Testing](#411-quality-control--testing)
   - 4.12 [Invoice & Dispatch](#412-invoice--dispatch)
5. [Technical Specifications](#5-technical-specifications)
6. [ISO 9001:2018 Compliance Requirements](#6-iso-90012018-compliance-requirements)
7. [User Interface Requirements](#7-user-interface-requirements)
8. [Implementation Phases](#8-implementation-phases)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Appendix](#10-appendix)

---

## 1. EXECUTIVE SUMMARY

This Product Requirements Document (PRD) defines the comprehensive requirements for developing a Steel Pipe Trading ERP system for N-PIPE, a company dealing in Stainless Steel, Carbon Steel, Alloy Steel, Nickel & Copper Alloys, Tubulars, and related products for Oil, Gas, Power & Petrochemical Industries.

### Business Context

**Stakeholder:** Karan Patil (Business Owner), Uttam Sir (Operations Head)

**Primary Business Need:** Replace Excel-based operations with a comprehensive ERP system that provides:

- ✅ Complete traceability from enquiry to invoice
- ✅ ISO 9001:2018 compliance for quality assurance
- ✅ Multi-company, multi-buyer business tracking
- ✅ Real-time inventory visibility for management
- ✅ Professional quotation generation with dual formats

### Development Priority

> **🔴 MODULE 1 (HIGHEST PRIORITY): Quotation Generation & Printing**
>
> All other modules will be developed in parallel but Quotation module must be completed first for immediate business use.

### Success Metrics

- 100% replacement of Excel-based workflow
- Quotation generation time reduced from 30 minutes to 5 minutes
- Zero manual errors in pricing and specifications
- Complete audit trail for ISO certification
- Real-time inventory accuracy >98%
- Buyer-wise revenue tracking and analysis

---

## 2. PRODUCT OVERVIEW

### 2.1 Core Objectives

| Objective | Description |
|-----------|-------------|
| **ISO 9001:2018 Compliance** | Maintain complete backtracking and data for all Quality Assurance tests performed |
| **Business Intelligence** | Track buyer-wise performance and opening balances for growth analysis |
| **Document Control** | Version control for quotations (Rev.01, Rev.02...Rev.0n) with complete history |
| **Multi-Company Support** | Handle different GST numbers for different office/establishment addresses |
| **Material Code Management** | Auto-generate and track material codes for products |
| **Real-time Visibility** | Inventory status and order tracking accessible to management remotely |
| **Professional Quotations** | Standard and non-standard formats with price visibility options |

### 2.2 Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 (App Router) with Turbopack |
| Language | TypeScript |
| Database | PostgreSQL via Supabase with Drizzle ORM |
| UI Components | Radix UI, Tailwind CSS, Framer Motion |
| State Management | Zustand (UI state only) |
| Form Handling | React Hook Form + Zod validation |
| Authentication | Supabase Auth with RBAC |
| PDF Generation | react-pdf / puppeteer |
| Excel Import/Export | ExcelJS |

---

## 3. CRITICAL REQUIREMENTS FROM KARAN PATIL

> **⚠️ The following 12 points are MANDATORY requirements identified by Karan Patil during stakeholder meetings**

### KP-1: ISO Compliance - Quality Assurance Tracking

**Priority:** 🔴 CRITICAL  
**ISO Reference:** Clause 8.6, 8.7

**Description:**  
Maintain complete backtracking and data storage for every Quality Assurance test performed. This includes incoming inspection, in-process checks, final inspection, and third-party testing. All test reports must be linked to Heat Numbers and traceable throughout the system.

**Requirements:**
- Store all QC inspection data with timestamps
- Link inspections to Heat Numbers
- Link inspections to MTC (Mill Test Certificates)
- Track: Chemical tests, Mechanical tests, Dimensional tests, Visual inspection
- Generate audit trail for ISO certification
- Never delete QC data (soft delete only)

---

### KP-2: Buyer Opening Balance & Business Growth Tracking

**Priority:** 🔴 CRITICAL  
**ISO Reference:** Clause 9.1

**Description:**  
Add opening balance field for every buyer from a particular company. Track business growth from each buyer over time. Generate reports showing buyer-wise revenue contribution, quotation conversion rates, and payment history.

**Requirements:**
- Opening balance field in Buyer Master (can be positive or negative)
- Track all transactions per buyer:
  - Number of enquiries
  - Number of quotations sent
  - Conversion rate (quotations → orders)
  - Total business value
  - Average order value
  - Payment history
- Generate buyer performance report
- Identify top buyers per customer

---

### KP-3: Multi-Address GSTIN Management

**Priority:** 🔴 CRITICAL  
**ISO Reference:** Clause 7.5

**Description:**  
Office address / Establishment address is different for companies, and GSTIN number changes with change in address. System must support multiple addresses per company with different GSTIN numbers. Quotations must pull correct GSTIN based on billing address selected.

**Requirements:**
- Company can have unlimited addresses
- Each address type: Registered Office, Branch, Warehouse, Billing
- Each address has own GSTIN number
- Quotation must show:
  - Selected billing address
  - Corresponding GSTIN
- Invoice generated from warehouse address (with warehouse GSTIN)
- Validate GSTIN format (15 characters)

---

### KP-4: Quotation Revision Control

**Priority:** 🔴 CRITICAL  
**ISO Reference:** Clause 7.5

**Description:**  
Complete backtracking of quotations with revision numbers (Rev.01, Rev.02...Rev.0n). System must save ALL previous versions of quotations for future reference. Each revision must track: what changed, who changed it, when it was changed, and why it was changed.

**Requirements:**
- First version: NPS/25/14408 Rev.00
- Creating revision generates: NPS/25/14408 Rev.01
- Never overwrite previous versions
- Track per revision:
  - What changed (field-level change log)
  - Who changed (employee name + ID)
  - When changed (timestamp)
  - Why changed (mandatory remarks field)
- Version comparison view (side-by-side diff)
- All versions printable
- Version history accessible forever

---

### KP-5: Buyer-Level Data Storage for Business Analysis

**Priority:** 🔴 CRITICAL  
**ISO Reference:** Clause 9.1

**Description:**  
Data of every buyer of every company must be stored separately. This enables analysis of which buyer gives the best business from that company. Track: number of enquiries, quotations sent, conversion rate, average order value, payment terms, and payment history.

**Requirements:**
- Separate Buyer Master table
- Link buyers to parent customer
- Track per buyer:
  - Total enquiries received
  - Quotations sent
  - Quotation conversion rate
  - Total orders value
  - Average order value
  - Payment behavior
  - Response time
- Generate reports:
  - Top buyers by revenue
  - Top buyers by conversion rate
  - Buyer performance trends
  - Customer-wise buyer analysis

---

### KP-6: Material Code Management

**Priority:** 🟡 HIGH  
**ISO Reference:** Clause 8.5.2

**Description:**  
Material code of a company/buyer should be used for future reference of orders. For companies that don't have material codes, system should auto-generate them. Material codes are used for N-PIPE's internal reference and must be unique per product variant.

**Requirements:**
- Material codes are for PRODUCTS (not companies)
- Auto-generate from product attributes
- Format: `FORM-PRODUCT-SPEC-SIZE`
  - Example: `PIPE-CS-A106-24SCH40`
- Allow manual override
- Ensure uniqueness
- Display on:
  - Quotations
  - Sales Orders
  - Purchase Orders
  - Invoices
  - Inventory records
  - MTC documents

---

### KP-7: Standard vs Non-Standard Quotation Formats

**Priority:** 🔴 CRITICAL

**Description:**  
Develop different and perfect formats for standard quotation and non-standard quotation. Standard quotations follow a fixed template. Non-standard quotations allow custom formatting based on client requirements. Both must be professional and maintain brand consistency.

**Requirements:**
- Standard Quotation:
  - Fixed template
  - Standard product categories
  - Predefined T&C
  - Faster generation
- Non-Standard Quotation:
  - Flexible layout
  - Custom product descriptions
  - Custom T&C
  - Custom pricing structure
- Both must include:
  - Company letterhead
  - GSTIN
  - Professional formatting
  - PDF output
  - Email capability

---

### KP-8: Dual Print Format - With/Without Prices

**Priority:** 🔴 CRITICAL

**Description:**  
When quotation is printed, provide option to print in 2 formats:
1. Price mentioned normally
2. Price NOT mentioned - "QUOTED" written in place of actual price

This is used when quotation needs to go through intermediaries who should not see pricing.

**Requirements:**
- Checkbox option during print: `☐ Hide Prices`
- If checked:
  - Replace all Unit Rate values with "QUOTED"
  - Replace all Amount values with "QUOTED"
  - Replace Subtotal with "QUOTED"
  - Replace Grand Total with "QUOTED"
- If unchecked:
  - Show all prices normally
- Save preference per quotation
- Both formats available for all revisions

---

### KP-9: Flexible Terms & Conditions

**Priority:** 🟡 HIGH

**Description:**  
Checkbox and editing options for Terms & Conditions in quotations. Different products may have different T&C. System should have: predefined T&C library, ability to select multiple T&C, ability to edit T&C per quotation, and ability to save custom T&C templates.

**Requirements:**
- 15 standard terms (from Standard_quotation.pdf):
  1. Price: Ex-work, Navi Mumbai, India/Jebel Ali, UAE
  2. Delivery: As above, ex-works, after receipt of PO
  3. Payment: 100% within 30 Days from date of dispatch
  4. Offer validity: 6 Days, subject to stock remain unsold
  5. Packing: Inclusive
  6. Freight: Extra at actual / To your account
  7. Insurance: Extra at actual / To your account
  8. Certification: EN 10204 3.1
  9. T/T charges: To your account, Full Invoice amount to be remitted
  10. Third Party Inspection: If any required that all charges Extra At Actual
  11. Testing Charges: If any required that all charges Extra At Actual
  12. Material origin: India/Canada
  13. Qty. Tolerance: -0 / +1 Random Length
  14. Dimension Tolerance: As per manufacture
  15. Part orders: Subject reconfirm with N-PIPE
- Show all terms with checkboxes
- Allow selection/deselection
- Allow editing text of each term
- Save custom T&C as templates
- Load customer's default T&C

---

### KP-10: Unique Quotation Numbering

**Priority:** 🔴 CRITICAL

**Description:**  
Every quotation should have a unique number that is auto-generated and follows company's numbering scheme. Format example: NPS/25/14408 where NPS is company code, 25 is year, 14408 is sequential number. Number should never be reused even if quotation is deleted.

**Requirements:**
- Format: `{COMPANY_CODE}/{YEAR}/{SEQUENCE}`
  - Example: `NPS/25/14408`
- COMPANY_CODE: From Company Master (3-5 chars)
- YEAR: Last 2 digits of current financial year
- SEQUENCE: Auto-increment starting from 1 each year
- NEVER reuse numbers (even if deleted)
- Sequence continues across revisions
  - NPS/25/14408 Rev.00
  - NPS/25/14408 Rev.01
  - NPS/25/14408 Rev.02
- Reset sequence to 1 each financial year

---

### KP-11: Remote Inventory Visibility

**Priority:** 🔴 CRITICAL

**Description:**  
Inventory control system must allow Uttam Sir to see complete inventory details without being physically present at warehouse. Real-time stock levels, Heat numbers, locations, quality status, reserved quantities - all should be visible on dashboard.

**Requirements:**
- Real-time inventory dashboard showing:
  - Total stock by product
  - Heat number wise stock
  - Location/Rack wise stock
  - Quality status (Under Inspection, Accepted, Rejected)
  - Reserved for SO (not available)
  - Available for sale
  - Slow-moving stock alert
  - Minimum stock level alert
- Search/Filter by:
  - Product
  - Heat Number
  - Specification
  - Size
  - Manufacturer
  - Quality Status
  - Date Received
- Export to Excel capability
- Reference: Current Excel INVENTORY_MASTER_-_LATEST.xlsx

---

### KP-12: Product-by-Product Order Status Tracking

**Priority:** 🔴 CRITICAL

**Description:**  
Status of order should be shown product-by-product on ERP system. Uttam Sir should be able to answer buyer queries just by looking at ERP. Track: Order received, PO sent to vendor, Material received, QC done, Ready to dispatch, Dispatched, Invoiced. Show timeline and expected completion dates.

**Requirements:**
- Order status dashboard per SO
- Product-wise status tracking:
  - ✓ Order Received (SO Date)
  - ✓ PO Sent to Vendor (PO Date, Vendor Name)
  - ⏳ Material Expected (Expected Delivery Date)
  - ✓ Material Received (GRN Date, Heat Number)
  - ⏳ QC In Progress (Inspector Name)
  - ✓ QC Completed (Passed/Failed, Date)
  - ✓ Ready to Dispatch (Quantity, Location)
  - ✓ Dispatched (Dispatch Date, Vehicle Number)
  - ✓ Invoiced (Invoice Number, Date)
- Timeline view with dates
- Expected vs Actual tracking
- Delay alerts
- Search by SO number or customer
- Mobile-responsive view

---

## 3.1 ADDITIONAL REQUIREMENTS FROM MEETING NOTES

> **Captured from detailed stakeholder meetings and notes**

### Login & Multi-Company

- **LOGIN-01:** Different login for different company and different employee. Each employee should have particular access rights based on role.
- **LOGIN-02:** Financial year date should be mentioned as different countries have different financial year dates.

### GST & Invoicing

- **GST-01:** Give GST number for warehouse address. Invoice is generated from warehouse, so warehouse address determines place of supply.
- **INV-01:** Invoice must have: Buyer address, Consignee address. Quotation does NOT need consignee address.

### Dispatch Address

- **SO-01:** Dispatch address is defined in purchase order. Capture dispatch address during order registration.

### Company & Employee

- **EMP-01:** No need to add company dropdown in employee addition. Once you login to a company, context is set.

### Vendor & Material Codes

- **VEND-01:** N-PIPE gets vendor code from customer company. Material code is for product (not company).
- **ADDR-01:** Implement pincode fetching API for automatic currency matching based on country.

### Quotation Settings

- **QUOT-01:** Set base quotation template at company level, then allow editing during quotation creation.
- **QUOT-02:** Support both Export and Domestic quotations with different formats and tax calculations.
- **QUOT-03:** Currency dropdown for foreign country quotations, but keep USD as default for exports.

### UI Simplifications

- **UI-01:** Remove "Primary Contact" option - keep it simple.
- **UI-02:** 2 address lines for vendors (keep it concise).

### Buyer Selection

- **BUYER-01:** Once customer is selected, buyer dropdown should show only buyers related to that customer.

### Fields to Remove

- **REMOVE-01:** Remove "Full Testing Compliance" option.
- **REMOVE-02:** Remove "Total" and "Testing" fields where not needed.
- **REMOVE-03:** Remove "Validity Days" and add "Due Date" instead.

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 AUTHENTICATION & MULTI-COMPANY SETUP

#### 4.1.1 Login System

**REQ-AUTH-001: Multi-Company Login**
- User selects company from dropdown before login
- Login credentials are company-specific
- Session maintains company context throughout
- Employee email is username

**REQ-AUTH-002: Role-Based Access Control (RBAC)**

| Role | Access |
|------|--------|
| Admin | Full system access, user management, settings |
| Sales | Enquiry, Quotation, SO, Customer management |
| Purchase | PR, PO, Vendor management |
| Quality | Inspections, MTC, NCR |
| Warehouse | GRN, Stock, Dispatch, Inventory |
| Accounts | Invoice, Receipt, Payments |
| Management | View-only access to all, MIS reports |

Permissions: Create, Read, Update, Delete, Approve

**REQ-AUTH-003: Admin Creation for Approval**
- First user for a company becomes Admin
- Admin creates other users
- Admin assigns roles and permissions
- Admin configures approval workflows

#### 4.1.2 Financial Year Management

**REQ-FY-001: Financial Year Configuration**
- Each company sets own FY start/end dates
- Support different countries:
  - India: 1 April - 31 March
  - USA: 1 January - 31 December
  - UK: 1 April - 31 March
  - UAE: 1 January - 31 December
- Document numbering resets per FY
- Historical data accessible across FYs
- Reports can span multiple FYs

---

### 4.2 COMPANY MASTER

#### 4.2.1 Company Information

**REQ-COMP-001: Basic Company Details**

| Field | Type | Mandatory | Validation |
|-------|------|-----------|------------|
| Company Type | Dropdown | Yes | Proprietorship, Partnership, LLP, Limited, Private Limited, HUF |
| Company Name | Text (200) | Yes | - |
| Company Code | Text (10) | Yes | Unique, used in doc numbering |
| PAN Number | Text (10) | Yes | Format: AAAAA9999A |
| TAN Number | Text (10) | No | - |
| CIN Number | Text (21) | Conditional | Required for companies |
| Telephone | Text | No | With country code |
| Email | Email | Yes | Valid email format |
| Website | URL | No | Valid URL |
| Logo | Image | No | PNG/JPG, max 2MB |

#### 4.2.2 Multi-Address Management

**REQ-COMP-002: Multiple Addresses with Different GSTIN**

- Support unlimited addresses per company
- Address Types:
  - Registered Office (mandatory)
  - Branch
  - Warehouse (for inventory)
  - Billing (for quotations)

**Address Fields:**

| Field | Type | Mandatory |
|-------|------|-----------|
| Address Type | Dropdown | Yes |
| Address Line 1 | Text (100) | Yes |
| Address Line 2 | Text (100) | No |
| City | Text (50) | Yes |
| State | Text (50) | Yes |
| Country | Dropdown | Yes |
| Pin Code | Text (10) | Yes |
| GSTIN | Text (15) | Yes |
| Is Default | Checkbox | No |

**GSTIN Validation:**
- Format: 22AAAAA0000A1Z5
- First 2 digits: State code
- Next 10 digits: PAN
- Next 1 digit: Entity number
- Next 1 digit: Z (default)
- Last 1 digit: Checksum

**Pin Code API Integration:**
- Auto-fetch city, state, country from pin code
- API: India Post / Google Maps Geocoding
- Validate pin code exists
- Set currency based on country

#### 4.2.3 Base Quotation Settings

**REQ-COMP-003: Company-Level Quotation Defaults**

| Setting | Type | Description |
|---------|------|-------------|
| Default Currency | Dropdown | INR (domestic), USD (export) |
| Default Payment Terms | Dropdown | From payment terms master |
| Default Delivery Terms | Dropdown | Ex-Works, FOB, CIF, CFR |
| Default Quotation Validity | Number | Days (e.g., 30) - REMOVED, use Due Date |
| Default T&C Template | Dropdown | From T&C templates |

**Note:** All defaults can be overridden during quotation creation

---

### 4.3 EMPLOYEE MASTER

#### 4.3.1 Employee Information

**REQ-EMP-001: Employee Details**

| Field | Type | Mandatory | Notes |
|-------|------|-----------|-------|
| Employee Code | Auto-gen | Yes | EMP001, EMP002... |
| Full Name | Text (100) | Yes | - |
| Department | Dropdown | Yes | Purchase, Sales, Quality, Warehouse, Accounts, Management |
| Designation | Text (50) | Yes | Manager, Executive, etc. |
| Email | Email | Yes | Used as login username |
| Mobile Number | Text | Yes | With country code |
| Telephone | Text | No | Optional |
| User Role | Dropdown | Yes | Linked to RBAC |
| Is Active | Checkbox | Yes | Default: Yes |

#### 4.3.2 User Account Linkage

**REQ-EMP-002: Link to Login Credentials**
- Employee record auto-creates user account
- Email becomes username
- Password:
  - Set by Admin OR
  - Sent via email for first-time setup
  - Must change on first login
- Employee can change password anytime

**REQ-EMP-003: No Company Selection for Employee**
- Employee belongs to ONE company only
- Company context set on login
- No company dropdown in employee form
- Multi-company users need separate employee records

---

### 4.4 CUSTOMER & BUYER MASTER

#### 4.4.1 Customer Master

**REQ-CUST-001: Customer Information**

| Field | Type | Mandatory | Notes |
|-------|------|-----------|-------|
| Customer Code | Auto-gen | Yes | CUST001, CUST002... |
| Customer Name | Text (200) | Yes | - |
| Customer Type | Dropdown | Yes | Domestic, Export |
| Primary Email | Email | Yes | - |
| Primary Phone | Text | Yes | With country code |
| GSTIN | Text (15) | Conditional | Required for domestic |
| PAN | Text (10) | No | - |
| Currency | Auto-set | Yes | Based on country |
| Credit Limit | Decimal | No | - |
| Payment Terms | Dropdown | Yes | From master |
| Opening Balance | Decimal | Yes | Can be +ve or -ve |
| Default T&C | Dropdown | No | From templates |

**REQ-CUST-002: Customer Addresses**

**Billing Address (Mandatory):**
- Address Line 1, 2
- City, State, Country, Pin Code

**Multiple Dispatch Addresses:**
- Used for invoice consignee details
- Each dispatch address can have:
  - Contact Person
  - Phone Number
  - Email

**Pin Code API:**
- Auto-fetch city/state/country
- Auto-set currency based on country

#### 4.4.2 Buyer Master (NEW)

> **🔴 CRITICAL: Unique requirement for tracking individual decision-makers**

**REQ-BUYER-001: Multiple Buyers per Customer**

| Field | Type | Mandatory | Notes |
|-------|------|-----------|-------|
| Buyer Code | Auto-gen | Yes | BUY001, BUY002... |
| Linked Customer | Dropdown | Yes | Parent customer |
| Buyer Name | Text (100) | Yes | - |
| Designation | Text (50) | Yes | - |
| Email | Email | Yes | - |
| Mobile Number | Text | Yes | With country code |
| Telephone | Text | No | - |
| Opening Balance | Decimal | Yes | Historical business value |
| Is Active | Checkbox | Yes | Default: Yes |

#### 4.4.3 Buyer-Customer Relationship

**REQ-BUYER-002: Contextual Buyer Selection**
- When creating enquiry/quotation:
  1. Select Customer first
  2. Buyer dropdown shows ONLY buyers for that customer
  3. Cannot select buyer without customer

**REQ-BUYER-003: Buyer Performance Tracking**

Track per buyer:
- Number of enquiries
- Quotations sent
- Quotation conversion rate
- Total orders value
- Average order value
- Payment behavior
- Response time

**Reports:**
- Top buyers by revenue
- Top buyers by conversion rate
- Buyer performance trends over time
- Customer-wise buyer analysis
- Buyer-wise product preferences

---

### 4.5 VENDOR MASTER

#### 4.5.1 Vendor Information

**REQ-VEND-001: Vendor Details**

| Field | Type | Mandatory | Notes |
|-------|------|-----------|-------|
| Vendor Code | Text/Auto-gen | Yes | From customer OR auto |
| Vendor Name | Text (200) | Yes | - |
| Vendor Type | Dropdown | Yes | Manufacturer, Trader, Service Provider |
| Address Line 1 | Text (100) | Yes | - |
| Address Line 2 | Text (100) | No | - |
| City | Text (50) | Yes | - |
| State | Text (50) | Yes | - |
| Country | Dropdown | Yes | - |
| Pin Code | Text (10) | Yes | - |
| Contact Person | Text (100) | Yes | - |
| Email | Email | Yes | - |
| Phone | Text | Yes | With country code |
| GSTIN | Text (15) | Conditional | For Indian vendors |
| Approval Status | Dropdown | Yes | Pending, Approved, Rejected, Suspended |
| Rating | Number (1-5) | No | Performance rating |

**REQ-VEND-002: Vendor Code Management**
- N-PIPE uses vendor codes FROM customer companies
- If customer doesn't provide: auto-generate (VEND001, VEND002...)
- Vendor code unique across all customers
- Can be updated if customer provides code later

**REQ-VEND-003: Approved Vendor Status**
- New vendors start as "Pending"
- Admin/Purchase approves vendors
- Only "Approved" vendors show in PO dropdown
- Can suspend vendors temporarily
- Track approval history

---

### 4.6 PRODUCT MASTER & MATERIAL CODES

#### 4.6.1 Hierarchical Product Structure

**REQ-PROD-001: Product Hierarchy**

```
Form → Product → Specification → Additional Spec → Dimension → Size → Ends → Length
```

**Example:**
- Form: **PIPE**
- Product: **C.S. SEAMLESS PIPE**
- Specification: **ASTM A106 GR.B**
- Additional Spec: **NACE MR0175/MR0103**
- Dimension Standard: **ASME B36.10**
- Size: **24" NB X Sch 40**
- Ends: **BE** (Bevel Ends)
- Length: **9.00 - 11.8 Mtrs**

**Product Forms:**
- PIPE
- TUBE
- FITTING
- FLANGE
- VALVE
- INSTRUMENTATION

#### 4.6.2 Material Code Auto-Generation

**REQ-PROD-002: Material Code Management**

> **Material codes are for PRODUCTS, not companies**

**Format:** `FORM-PRODUCT-SPEC-SIZE`

**Examples:**
- `PIPE-CS-A106-24SCH40`
- `PIPE-SS-A312-2SCH10S`
- `FITTING-CS-A234-90EL-4`
- `FLANGE-SS-A182-WN-6-150`

**Requirements:**
- Auto-generate from product attributes
- Ensure uniqueness
- Allow manual override
- Maximum 50 characters
- Display on all documents:
  - Quotations
  - Sales Orders
  - Purchase Orders
  - Invoices
  - GRN
  - Inventory
  - MTC

#### 4.6.3 Pipe Size Masters Integration

**REQ-PROD-003: Size Master Database**

**Import from Excel:**
- **CS & AS PIPES:** 192 sizes from `PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx`
- **SS & DS PIPES:** 81 sizes from `PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx`

**Each size record:**
- Size (e.g., "24\" NB X Sch 40")
- OD - Outer Diameter (mm)
- WT - Wall Thickness (mm)
- Weight (kg/m)

**REQ-PROD-004: Auto-Fill from Size Masters**
- When selecting size in quotation
- Auto-fill OD, WT, Weight
- Allow manual override for non-standard
- Calculate total weight: `Quantity (Mtrs) × Weight (kg/m)`

#### 4.6.4 Product Specification Library

**REQ-PROD-005: Specification Master**

**Import from:** `PRODUCT_SPEC_MASTER_-_1.xlsx` (246 specifications)

**Each specification record:**
- Product (e.g., "C.S. SEAMLESS PIPE")
- Material (e.g., "ASTM A106 GR.B")
- Additional Spec (e.g., "NACE MR0175")
- Ends (e.g., "BE", "PE", "NPTM")
- Length range (e.g., "5.00 - 7.00")

**Usage:**
- Lookup during quotation creation
- Validate product combinations
- Suggest common specifications
- Allow new specifications

---

### 4.7 QUOTATION MANAGEMENT (MODULE 1 - PRIORITY)

> **⚠️ HIGHEST PRIORITY MODULE - MUST BE COMPLETED FIRST**

#### 4.7.1 Quotation Creation Workflow

**REQ-QUOT-001: Quotation Initiation**

**Can be created from:**
- New enquiry
- Existing enquiry
- Direct (no enquiry)

**Workflow:**
1. Select Customer
2. Select Buyer (filtered by customer)
3. Auto-load customer defaults:
   - Currency
   - Payment Terms
   - Default T&C
4. Allow override of all defaults
5. Add line items
6. Configure T&C
7. Save as draft OR submit for approval

#### 4.7.2 Quotation Header

**REQ-QUOT-002: Header Fields**

| Field | Type | Source | Mandatory |
|-------|------|--------|-----------|
| Quotation Number | Auto-gen | System | Yes |
| Quotation Date | Date | Auto (editable) | Yes |
| Customer | Dropdown | Customer Master | Yes |
| Buyer | Dropdown | Buyer Master (filtered) | Yes |
| Enquiry Reference | Text | From enquiry | No |
| Enquiry Date | Date | From enquiry | No |
| Quotation Type | Dropdown | Standard/Non-Standard/Export/Domestic | Yes |
| Currency | Dropdown | Auto from customer | Yes |
| Exchange Rate | Decimal | Manual entry | Conditional |
| Billing Address | Dropdown | Company addresses | Yes |
| GSTIN | Auto | From selected address | Yes |
| Payment Terms | Dropdown | Payment Terms Master | Yes |
| Delivery Terms | Dropdown | Ex-Works/FOB/CIF/CFR | Yes |
| Due Date | Date | Date picker | Yes |
| Internal Remarks | Text Area | - | No |

**Quotation Number Format:**
```
{COMPANY_CODE}/{YEAR}/{SEQUENCE}
Example: NPS/25/14408
```

**Quotation Number with Revision:**
```
NPS/25/14408 Rev.00  (First version)
NPS/25/14408 Rev.01  (First revision)
NPS/25/14408 Rev.02  (Second revision)
```

#### 4.7.3 Quotation Line Items

**REQ-QUOT-003: Product Line Item Builder**

| Column | Type | Notes |
|--------|------|-------|
| S.No. | Auto | 1, 2, 3... |
| Material Code | Auto/Manual | From product attributes |
| Product | Hierarchical | Form → Product → Spec... |
| Additional Specification | Text | NACE, H2 SERVICE, etc. |
| Size | Dropdown | From Size Masters |
| OD (mm) | Auto | From Size Master |
| WT (mm) | Auto | From Size Master |
| Weight (kg/m) | Auto | From Size Master |
| Ends | Dropdown | BE, PE, NPTM, BSPT |
| Length (Mtrs) | Text | Range (e.g., 9.00-11.8) |
| Quantity (Mtrs) | Decimal | User input |
| Unit Rate | Decimal | Currency/Mtr |
| Amount | Auto | Qty × Rate |
| Delivery | Text | Ex-works timeline |
| Remark | Text | Optional notes |

**Line Item Actions:**
- Add new line
- Delete line
- Reorder lines (drag & drop)
- Duplicate line
- Bulk import from Excel

#### 4.7.4 Pricing & Costing

**REQ-QUOT-004: Costing Breakdown**

For each line item, track:
- **Material Cost**
- **Logistics Cost**
- **Inspection Cost**
- **Margin %**

**Calculation:**
```
Final Unit Rate = (Material + Logistics + Inspection) × (1 + Margin%)
```

**Show/Hide Costing:**
- Costing visible only to Sales/Admin
- Customer sees only final Unit Rate
- Option to show costing in internal reports

**REQ-QUOT-005: Total Calculations**

```
Subtotal = Sum of all line item amounts
Discount = Percentage OR Flat amount (optional)
Taxable Value = Subtotal - Discount

For Domestic (GSTIN same state):
  CGST = Taxable Value × CGST%
  SGST = Taxable Value × SGST%
  Total Tax = CGST + SGST

For Domestic (GSTIN different state):
  IGST = Taxable Value × IGST%
  Total Tax = IGST

For Export:
  IGST = 0 (zero-rated)

Grand Total = Taxable Value + Total Tax
```

#### 4.7.5 Terms & Conditions

**REQ-QUOT-006: 15 Standard Terms**

```
1. Price: Ex-work, Navi Mumbai, India/Jebel Ali, UAE
2. Delivery: As above, ex-works, after receipt of PO
3. Payment: 100% within 30 Days from date of dispatch
4. Offer validity: 6 Days, subject to stock remain unsold
5. Packing: Inclusive
6. Freight: Extra at actual / To your account
7. Insurance: Extra at actual / To your account
8. Certification: EN 10204 3.1
9. T/T charges: To your account, Full Invoice amount to be remitted
10. Third Party Inspection: If any required that all charges Extra At Actual
11. Testing Charges: If any required that all charges Extra At Actual
12. Material origin: India/Canada
13. Qty. Tolerance: -0 / +1 Random Length
14. Dimension Tolerance: As per manufacturer
15. Part orders: Subject reconfirm with N-PIPE
```

**REQ-QUOT-007: T&C Management**

**Features:**
- Show all 15 terms with checkboxes
- Allow select/deselect individual terms
- Allow editing text of each selected term
- Option to add custom terms (unlimited)
- Save custom T&C sets as templates
- Load customer's default T&C
- Preview T&C section before saving

**T&C Templates:**
- Create named templates (e.g., "Standard Export", "NACE Compliance")
- Set template as company default
- Set template as customer default
- Select template during quotation creation

#### 4.7.6 Quotation Revision Control

**REQ-QUOT-008: Version Management**

> **🔴 CRITICAL: Complete backtracking of ALL versions**

**Revision Creation:**
- Click "Create Revision" button on approved quotation
- System creates NEW quotation with Rev.01
- Original quotation remains as Rev.00
- All data copied to new revision
- User can now edit new revision

**Revision Tracking:**

Track per revision:
- ✅ What changed (field-level change log)
- ✅ Who changed (employee name + ID)
- ✅ When changed (timestamp)
- ✅ Why changed (mandatory remarks)

**Change Log Example:**
```
Rev.01 - Created on 2026-02-07 10:30 AM by Karan Patil (EMP001)
Reason: Customer requested price reduction

Changes:
- Line 1: Unit Rate changed from 150.00 to 145.00
- Line 3: Quantity changed from 1400 Mtrs to 1500 Mtrs
- Payment Terms changed from "30 Days" to "45 Days"
- Term #3 edited: "Payment: 100% within 45 Days from date of dispatch"
```

**Version Features:**
- View all revisions (list view)
- Side-by-side comparison (diff view)
- Print any revision
- Email any revision
- Never delete any revision (soft delete only)
- Version history accessible forever

#### 4.7.7 Quotation Output Formats

**REQ-QUOT-009: Dual Document Generation**

> **🔴 Generate 2 separate quotation PDFs**

**1. COMMERCIAL QUOTATION**
- Company letterhead with logo
- GSTIN number
- Quotation number & date
- Customer details
- **ALL PRICING VISIBLE**
- Payment terms
- Delivery terms
- Tax calculations (CGST/SGST/IGST)
- Grand total
- Complete T&C section
- Authorized signatory

**2. TECHNICAL QUOTATION**
- Company letterhead with logo
- Quotation number & date
- Customer details
- **NO PRICING** - Shows "QUOTED" instead
- Material specifications
- Testing requirements
- Dimensional details
- Standards & compliance
- MTC requirements
- Quality assurance parameters
- Technical T&C only
- Authorized signatory

**REQ-QUOT-010: Price Visibility Option**

> **🔴 Hide/Show prices on print**

**Checkbox during print:** `☐ Hide All Prices`

**If checked:**
- Replace all Unit Rate → "QUOTED"
- Replace all Amount → "QUOTED"
- Replace Subtotal → "QUOTED"
- Replace Tax amounts → "QUOTED"
- Replace Grand Total → "QUOTED"
- Keep all other data intact

**If unchecked:**
- Show all prices normally

**Use Case:**
When quotation goes through agents/intermediaries who should not see pricing.

**Save Preference:**
- Save hide/show preference per quotation
- Option available for all revisions
- Option available for both Commercial & Technical

#### 4.7.8 Quotation Approval Workflow

**REQ-QUOT-011: Approval Process**

**Status Flow:**
```
Draft → Pending Approval → Approved → Sent
                ↓
            Rejected → Draft (back to editing)
```

**Permissions:**
- Sales: Can create, edit draft, submit for approval
- Manager/Admin: Can approve/reject
- Once approved: Locked (create revision to change)

**Approval Features:**
- Email notification to approver
- Approver can add remarks
- Approval history tracked
- Can set auto-approval rules (e.g., below X amount)

**Sending Quotation:**
- Email to customer
- Email to buyer
- CC to internal team
- Attach PDF (Commercial + Technical)
- Track email sent status
- Track email opened (if possible)

#### 4.7.9 Quotation to Sales Order Conversion

**REQ-QUOT-012: Convert to SO**

**Conditions:**
- Quotation must be Approved
- Customer has sent PO
- Click "Convert to SO" button

**Auto-populate SO:**
- Customer, Buyer
- All line items (editable)
- Payment terms
- Delivery terms
- Link to quotation number
- Customer PO number (manual entry)
- Customer PO date (manual entry)

---

### 4.8 SALES ORDER MANAGEMENT

**REQ-SO-001: Sales Order Creation**

**Sources:**
- Convert from approved quotation (primary)
- Create new SO directly (if urgent)

**SO Header:**

| Field | Type | Mandatory |
|-------|------|-----------|
| SO Number | Auto-gen | Yes |
| SO Date | Date | Yes |
| Customer | From quotation | Yes |
| Buyer | From quotation | Yes |
| Quotation Reference | Link | Yes |
| Customer PO Number | Text | Yes |
| Customer PO Date | Date | Yes |
| Payment Terms | From quotation | Yes |
| Delivery Terms | From quotation | Yes |
| Dispatch Address | Dropdown | Yes |
| Expected Delivery | Date | Yes |
| SO Status | Dropdown | Yes |

**SO Status:**
- Open
- In Progress
- Partial Dispatch
- Completed
- Cancelled

**REQ-SO-002: Product-wise Status Tracking**

> **🔴 CRITICAL: Track each product separately**

For each line item in SO:
- ✓ Order Received (SO Date)
- ⏳ PO Sent to Vendor (PO Number, Date)
- ⏳ Material Expected (Expected Date)
- ✓ Material Received (GRN Number, Date, Heat Number)
- ⏳ QC In Progress (Inspector Name)
- ✓ QC Completed (Pass/Fail, Date)
- ✓ Ready to Dispatch (Quantity, Location)
- ✓ Dispatched (Dispatch Number, Date, Vehicle)
- ✓ Invoiced (Invoice Number, Date)

**Timeline View:**
- Show as horizontal timeline
- Green checkmark for completed
- Orange for in-progress
- Red for delayed
- Gray for pending

**Expected vs Actual:**
- Show expected date
- Show actual date
- Calculate delay (if any)
- Alert if delay >3 days

**REQ-SO-003: Dispatch Address**

- Capture during SO creation
- Can be different from billing address
- Will appear on invoice as "Consignee"
- Fields:
  - Company Name
  - Address (2 lines)
  - City, State, Pin Code
  - Contact Person
  - Phone, Email

---

### 4.9 PURCHASE ORDER MANAGEMENT

**REQ-PO-001: Purchase Order Creation**

**Sources:**
- From Sales Order (manual)
- From Purchase Requisition

**PO Header:**

| Field | Type | Mandatory |
|-------|------|-----------|
| PO Number | Auto-gen | Yes |
| PO Date | Date | Yes |
| Vendor | Dropdown (approved only) | Yes |
| SO Reference | Link | Optional |
| Payment Terms | Dropdown | Yes |
| Delivery Terms | Dropdown | Yes |
| Delivery Address | Text | Yes |
| Expected Delivery | Date | Yes |
| PO Status | Dropdown | Yes |

**PO Status:**
- Draft
- Approved
- Sent
- Partial Received
- Received
- Cancelled

**REQ-PO-002: PO Line Items**

| Column | Type |
|--------|------|
| S.No. | Auto |
| Material Code | From SO/Product |
| Product Description | Text |
| Specification | Text |
| Size | Text |
| Quantity | Decimal |
| Unit | Text |
| Unit Rate | Decimal |
| Amount | Auto |
| Expected Delivery | Date |

**REQ-PO-003: PO to GRN Tracking**

- Link PO to multiple GRNs (partial receipt)
- Track received vs ordered quantity
- Alert when fully received
- Track pending quantity
- Show aging of pending orders

---

### 4.10 INVENTORY MANAGEMENT

**REQ-INV-001: Inventory Dashboard**

> **🔴 CRITICAL: Remote visibility for Uttam Sir**

**Real-time Dashboard showing:**
- Total stock by product
- Heat number wise stock
- Location/Rack wise stock
- Quality status:
  - Under Inspection
  - Accepted
  - Rejected
- Reserved for SO (not available)
- Available for sale
- Slow-moving stock (>90 days)
- Minimum stock alerts

**REQ-INV-002: Inventory Record**

| Field | Type | Notes |
|-------|------|-------|
| Inventory ID | Auto-gen | Unique |
| Product | From Product Master | - |
| Heat Number | Text | CRITICAL for traceability |
| MTC Number | Text | Mill Test Certificate |
| MTC Date | Date | - |
| Manufacturer | Text | Make |
| Quantity | Decimal | In Mtrs/Pieces |
| Unit | Text | Mtrs/Pieces/Kg |
| Location | Text | Rack/Bin |
| Warehouse | Dropdown | Which warehouse |
| Quality Status | Dropdown | Under Inspection/Accepted/Rejected |
| Reserved Qty | Decimal | Allocated to SO |
| Available Qty | Auto | Quantity - Reserved |
| GRN Reference | Link | Which GRN |
| Received Date | Date | From GRN |

**REQ-INV-003: Search & Filter**

Search by:
- Product name
- Heat Number
- Material Code
- Specification
- Size
- Manufacturer
- Date range

Filter by:
- Product category
- Quality status
- Warehouse
- Slow-moving (yes/no)
- Below minimum level (yes/no)

**REQ-INV-004: FIFO Implementation**

- When allocating stock to SO:
  - Prioritize oldest stock first
  - Based on Received Date
  - Within same product & specification
  - Show Heat Number of allocated stock

**REQ-INV-005: Location/Rack Management**

- Create warehouse locations
- Format: `WAREHOUSE-AISLE-RACK-SHELF`
  - Example: `WH1-A-05-2`
- Assign location during GRN
- Update location during stock movement
- Show location in inventory dashboard

**REQ-INV-006: Stock Alerts**

- Minimum stock level per product
- Email alert when below minimum
- Slow-moving stock report (>90 days)
- Stock aging report
- Expiry alert (if applicable)

**REQ-INV-007: Export to Excel**

- Export current inventory
- Filter before export
- Columns:
  - Product, Spec, Size
  - Heat Number, MTC Number
  - Quantity, Unit
  - Location, Warehouse
  - Quality Status
  - Received Date, Manufacturer

**Reference:** `INVENTORY_MASTER_-_LATEST.xlsx` (55 items)

---

### 4.11 QUALITY CONTROL & TESTING

**REQ-QC-001: Incoming Inspection**

**Trigger:** Material received via GRN

**Inspection Record:**

| Field | Type |
|-------|------|
| Inspection Number | Auto-gen |
| GRN Reference | Link |
| Product | From GRN |
| Heat Number | From GRN |
| Quantity | From GRN |
| Inspector | Employee |
| Inspection Date | Date |
| Inspection Type | Dropdown |
| Test Results | Details |
| Status | Pass/Fail/Hold |
| Remarks | Text |

**REQ-QC-002: Testing Standards**

**Import from:** `TESTING_MASTER_FOR_LAB_LETTER.xlsx`

**12 Test Types:**
1. Chemical Analysis
2. Mechanical Test
3. Flattening Test
4. Flaring Test
5. Hydrostatic Test
6. Visual Inspection
7. Dimensional Check
8. Hardness Test
9. Impact Test
10. Bend Test
11. PMI (Positive Material Identification)
12. NDT (Non-Destructive Testing)

**For each test:**
- Test Name
- Test Standard (ASTM, ISO, etc.)
- Acceptance Criteria
- Testing Agency (if third-party)

**REQ-QC-003: Inspection Checklist**

- Select applicable tests
- Checkbox for each test
- Enter test values
- Enter acceptance range
- Pass/Fail per test
- Overall result
- Attach test reports (PDF)

**REQ-QC-004: MTC (Mill Test Certificate) Management**

**MTC Upload:**
- Upload PDF from mill
- Link to Heat Number
- Link to GRN
- Link to Product
- Extract key data:
  - Heat Number
  - Chemical composition
  - Mechanical properties
  - Test results
  - Mill name
  - Date of manufacture

**MTC Generation:**
- Create MTC for client
- Use client-specific template
- Pull data from inspection
- Include:
  - Heat Number
  - Product details
  - Chemical composition
  - Mechanical properties
  - Test results
  - Certification
  - Company seal & signature

**REQ-QC-005: NCR (Non-Conformance Report)**

**Basic NCR (Current):**
- NCR Number
- Product, Heat Number
- Description of non-conformance
- Status: Open, Under Investigation, Action Taken, Closed

**Enhanced NCR (Required):**
- Root Cause Analysis
  - 5 Why analysis
  - Fishbone diagram (optional)
  - Root cause identified
- Corrective Action Plan
  - Action items
  - Responsible person
  - Target date
  - Priority
- Preventive Actions
  - Process improvements
  - Training needs
- Verification of Effectiveness
  - How to verify
  - Verification date
  - Verified by
- Approval & Closure
  - Approved by (Quality Manager)
  - Closure date
  - Closure remarks

---

### 4.12 INVOICE & DISPATCH

**REQ-INV-001: Dispatch Process**

**Dispatch Note:**

| Field | Type |
|-------|------|
| Dispatch Number | Auto-gen |
| Dispatch Date | Date |
| SO Reference | Link |
| Customer | From SO |
| Consignee | Dispatch Address |
| Vehicle Number | Text |
| Driver Name | Text |
| Driver Phone | Text |
| LR Number | Text |
| E-Way Bill | Text |

**Dispatch Items:**
- Select items from SO
- Heat Number(s)
- Quantity dispatched
- Packaging details
- Net Weight, Gross Weight

**REQ-INV-002: Invoice Generation**

**Trigger:** After dispatch

**Invoice Header:**

| Field | Type |
|-------|------|
| Invoice Number | Auto-gen |
| Invoice Date | Date |
| SO Reference | Link |
| Dispatch Reference | Link |
| Customer (Buyer) | From SO |
| Consignee | From Dispatch |
| Billing Address | Company address (GSTIN) |
| Place of Supply | State |
| Due Date | Date |

**Invoice must have:**
- Buyer Address
- Consignee Address (dispatch location)
- GSTIN from warehouse address (place of supply)

**Note:** Quotation does NOT need consignee address

**Tax Calculation:**
- If billing GSTIN state = warehouse GSTIN state:
  - CGST + SGST
- If different state:
  - IGST
- For export:
  - IGST 0%

**REQ-INV-003: Payment Receipt**

- Receipt Number
- Receipt Date
- Invoice Reference
- Payment Mode:
  - Cash
  - Cheque
  - NEFT/RTGS
  - UPI
  - Wire Transfer
- Amount Received
- Bank Details
- Reference Number
- Remarks

---

## 5. TECHNICAL SPECIFICATIONS

### 5.1 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 15 (App Router) |
| Build Tool | Turbopack | Latest |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 15+ |
| ORM | Drizzle | Latest |
| Backend | Supabase | Latest |
| UI Library | Radix UI | Latest |
| Styling | Tailwind CSS | 3.x |
| Animation | Framer Motion | Latest |
| State Management | Zustand | Latest |
| Form Handling | React Hook Form | 7.x |
| Validation | Zod | Latest |
| PDF Generation | react-pdf / Puppeteer | Latest |
| Excel Import/Export | ExcelJS | Latest |
| Charts | Recharts | Latest |

### 5.2 Database Schema Highlights

**Core Tables:**
- companies
- company_addresses
- employees
- users (linked to employees)
- customers
- customer_addresses
- buyers
- vendors
- products
- product_specifications
- pipe_sizes_cs_as (192 rows)
- pipe_sizes_ss_ds (81 rows)
- enquiries
- quotations
- quotation_versions
- quotation_line_items
- quotation_terms
- sales_orders
- so_line_items
- purchase_orders
- po_line_items
- inventory
- warehouse_locations
- grn
- grn_line_items
- inspections
- inspection_tests
- testing_standards (12 types)
- mtc_documents
- ncr
- dispatches
- dispatch_items
- invoices
- invoice_items
- payment_receipts

**Key Relationships:**
- quotations → quotation_versions (1:many)
- customers → buyers (1:many)
- companies → company_addresses (1:many)
- sales_orders → so_line_items (1:many)
- inventory → heat_number (tracked)
- inventory → mtc_documents (linked)

### 5.3 API Structure

**Next.js API Routes:**
```
/api/auth/login
/api/auth/logout
/api/companies
/api/employees
/api/customers
/api/buyers
/api/vendors
/api/products
/api/quotations
/api/quotations/[id]/versions
/api/quotations/[id]/convert-to-so
/api/sales-orders
/api/sales-orders/[id]/status
/api/purchase-orders
/api/inventory
/api/inventory/search
/api/grn
/api/qc/inspections
/api/qc/mtc
/api/qc/ncr
/api/dispatch
/api/invoices
/api/reports/buyer-performance
/api/reports/inventory-aging
/api/reports/order-status
```

### 5.4 Security

**Authentication:**
- Supabase Auth
- Email + Password
- Session-based
- Secure cookies

**Authorization:**
- Role-Based Access Control (RBAC)
- Row-Level Security (RLS) in Supabase
- API route protection
- Client-side route guards

**Data Protection:**
- All sensitive data encrypted at rest
- HTTPS only
- Input validation (Zod schemas)
- SQL injection prevention (ORM)
- XSS protection
- CSRF tokens

**Audit Trail:**
- Every transaction logged
- User, timestamp, action
- Before/after values for updates
- Soft deletes (never hard delete approved docs)

### 5.5 Performance

**Optimization:**
- Server-side rendering (SSR) for dashboards
- Static generation for reports
- Lazy loading for heavy components
- Database indexing:
  - heat_number
  - mtc_number
  - customer_id
  - quotation_number
  - invoice_number
- Caching strategy:
  - Redis for session data
  - Database query caching
  - Static asset CDN

**Scalability:**
- Horizontal scaling via Vercel/AWS
- Database connection pooling
- Background jobs for:
  - Email sending
  - PDF generation
  - Report generation
  - Data imports

---

## 6. ISO 9001:2018 COMPLIANCE REQUIREMENTS

### 6.1 Document Control (Clause 7.5)

| Requirement | Implementation |
|-------------|----------------|
| Auto Document Numbering | ✓ All modules |
| Revision Control | ✓ Quotations (KP-4) |
| Approval Workflows | ✓ Quotations, POs |
| Controlled Templates | To be implemented |
| Audit Trail | ✓ All transactions |

### 6.2 Traceability (Clause 8.5.2)

**Full Chain:**
```
Enquiry → Quotation → SO → PO → GRN → Inventory → Dispatch → Invoice
```

**Heat Number Tracking:**
- Captured at GRN
- Stored in Inventory
- Tracked through Dispatch
- Printed on Invoice
- Linked to MTC

### 6.3 Quality Control (Clause 8.6, 8.7)

- Incoming inspection
- Testing standards (12 types)
- MTC management
- NCR with root cause analysis
- Corrective actions
- Effectiveness verification

### 6.4 Management Review (Clause 9.3)

**MIS Reports:**
- Sales vs Target
- Quotation conversion
- Inventory aging
- Vendor performance
- Customer payment aging
- NCR trends
- On-time delivery

---

## 7. USER INTERFACE REQUIREMENTS

### 7.1 Dashboard (Home)

**Role-wise Dashboards:**

**Sales Dashboard:**
- Open enquiries
- Pending quotations
- Quotations awaiting approval
- Active sales orders
- Recent customers

**Purchase Dashboard:**
- Pending POs
- Expected deliveries
- Vendor performance
- Purchase requests

**Warehouse Dashboard:**
- Current stock levels
- Heat number wise stock
- Pending GRNs
- Pending dispatches
- Location wise stock

**Quality Dashboard:**
- Pending inspections
- Open NCRs
- MTC upload pending
- Test results summary

**Management Dashboard:**
- KPI cards (Revenue, Orders, Inventory Value)
- Sales trends (chart)
- Order status overview
- Inventory alerts
- Top customers
- Top products

### 7.2 Quotation Form

**Layout:**
- Left sidebar: Customer selection, quotation details
- Main area: Line items table (Excel-like)
- Right sidebar: Totals, tax calculation
- Bottom: T&C section (expandable)
- Top actions: Save Draft, Submit for Approval, Create Revision

**UX Features:**
- Auto-save draft (every 30 seconds)
- Keyboard shortcuts (Tab, Enter for next field)
- Inline editing in line items
- Drag & drop to reorder lines
- Bulk copy/paste from Excel
- Real-time total calculation
- Currency converter (if multi-currency)
- Validation messages (red highlight)

### 7.3 Inventory Dashboard

**View Modes:**
- Grid view (cards)
- Table view (Excel-like)
- Kanban view (by status)

**Filters (Left Sidebar):**
- Product category
- Quality status
- Warehouse
- Heat number search
- Date range
- Manufacturer

**Export Options:**
- Excel
- PDF
- CSV

### 7.4 Order Status Page

**Timeline View:**
- Horizontal timeline
- Color-coded steps
- Tooltips on hover
- Click to see details

**Product Cards:**
- Product image (if available)
- Product name, spec, size
- Heat number
- Current status
- Expected date
- Actual date
- Delay (if any)

### 7.5 Mobile Responsiveness

**Priority Screens (must work on mobile):**
- Dashboard
- Inventory search
- Order status
- QC inspection entry
- Dispatch entry

**Features:**
- Touch-friendly buttons (min 44x44px)
- Swipe gestures
- Offline capability (for warehouse)
- Camera integration (for MTC upload)

---

## 8. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-3) 🔴 CRITICAL

**Week 1: Authentication & Masters**
- Multi-company setup
- Employee master
- Role-based access control
- Company addresses with GSTIN

**Week 2: Customer & Buyer Setup**
- Customer master
- Buyer master (NEW)
- Buyer-customer relationship
- Opening balances

**Week 3: Product & Inventory Foundation**
- Product master
- Hierarchical product structure
- Material code auto-generation
- Import pipe size masters (273 sizes)
- Import product specs (246 specs)

### Phase 2: Quotation Module (Week 4-6) 🔴 PRIORITY 1

**Week 4-5: Core Quotation**
- Quotation creation workflow
- Line item builder
- Pricing & costing
- T&C management (15 standard terms)
- Approval workflow

**Week 6: Advanced Quotation**
- Revision control (KP-4)
- Dual format generation (Commercial + Technical)
- Hide/show prices option (KP-8)
- PDF generation
- Email sending

### Phase 3: Sales & Purchase (Week 7-9)

**Week 7: Sales Orders**
- SO creation from quotation
- Product-wise status tracking (KP-12)
- Timeline view
- Expected vs Actual

**Week 8: Purchase Orders**
- PO creation
- Vendor management
- PO to GRN tracking

**Week 9: Integration**
- SO → PO linkage
- PO → GRN → Inventory flow

### Phase 4: Inventory & Quality (Week 10-12)

**Week 10: Inventory Management**
- Inventory dashboard (KP-11)
- Heat number tracking
- Location/Rack management
- FIFO implementation
- Search & filters

**Week 11: Quality Control**
- Incoming inspection
- Testing standards (12 types)
- MTC upload & generation
- Link MTC to Heat Number

**Week 12: NCR Enhancement**
- Enhanced NCR (root cause, corrective action)
- Effectiveness verification
- Approval & closure

### Phase 5: Dispatch & Finance (Week 13-14)

**Week 13: Dispatch**
- Dispatch note generation
- Vehicle tracking
- E-way bill

**Week 14: Invoicing**
- Invoice generation
- Payment receipts
- Outstanding tracking

### Phase 6: Reports & Analytics (Week 15-16)

**Week 15: Buyer Analytics (KP-5)**
- Buyer performance report
- Quotation conversion by buyer
- Revenue by buyer
- Top buyers per customer

**Week 16: Management Reports**
- Sales vs Target
- Inventory aging
- Vendor performance
- Customer payment aging
- NCR trends
- On-time delivery

### Phase 7: Testing & Go-Live (Week 17-18)

**Week 17: UAT**
- User Acceptance Testing
- Bug fixes
- Performance optimization

**Week 18: Deployment**
- Data migration from Excel
- User training
- Go-live support

**Total Timeline:** 18 weeks (4.5 months)

---

## 9. ACCEPTANCE CRITERIA

### 9.1 Module 1: Quotation (PRIORITY)

**Must Have:**
- ✅ Create quotation with all fields
- ✅ Add/edit/delete line items
- ✅ Auto-fill from size masters
- ✅ Material code auto-generation
- ✅ 15 T&C with checkboxes
- ✅ Custom T&C editing
- ✅ Revision control (KP-4)
- ✅ Dual format PDF (Commercial + Technical)
- ✅ Hide/show prices option (KP-8)
- ✅ Approval workflow
- ✅ Email quotation
- ✅ Convert to SO

**Performance:**
- Create quotation in <5 minutes
- Generate PDF in <10 seconds
- All revisions accessible

### 9.2 Buyer Master

**Must Have:**
- ✅ Create buyers linked to customer
- ✅ Opening balance tracking (KP-2)
- ✅ Contextual buyer selection (filtered by customer)
- ✅ Buyer performance report (KP-5)
- ✅ Track: enquiries, quotations, conversions, revenue

### 9.3 Inventory Management

**Must Have:**
- ✅ Real-time inventory dashboard (KP-11)
- ✅ Heat number tracking
- ✅ Location/Rack management
- ✅ Quality status tracking
- ✅ Search by heat number, product, spec
- ✅ Export to Excel
- ✅ FIFO allocation
- ✅ Stock alerts

### 9.4 Order Status Tracking

**Must Have:**
- ✅ Product-by-product status (KP-12)
- ✅ Timeline view
- ✅ Expected vs Actual dates
- ✅ Delay alerts
- ✅ Heat number visible at each stage
- ✅ Mobile-responsive

### 9.5 ISO Compliance

**Must Have:**
- ✅ Complete audit trail
- ✅ Revision history for quotations
- ✅ QC inspection records
- ✅ MTC linkage to Heat Number
- ✅ NCR with root cause analysis
- ✅ Traceability from enquiry to invoice

---

## 10. APPENDIX

### 10.1 Glossary

| Term | Definition |
|------|------------|
| Heat Number | Unique identifier for a batch of metal from manufacturer |
| MTC | Mill Test Certificate - quality certificate from manufacturer |
| NCR | Non-Conformance Report - document for defects |
| GSTIN | Goods and Services Tax Identification Number |
| PAN | Permanent Account Number (India tax ID) |
| GRN | Goods Received Note - document for incoming material |
| SO | Sales Order |
| PO | Purchase Order |
| FIFO | First In First Out - inventory allocation method |
| OD | Outer Diameter |
| WT | Wall Thickness |
| BE | Bevel Ends |
| PE | Plain Ends |
| NPTM | National Pipe Thread Male |
| BSPT | British Standard Pipe Thread |

### 10.2 Standard Specifications

**Common Pipe Specifications:**
- ASTM A106 GR.B - Carbon Steel Seamless
- ASTM A53 GR.B - Carbon Steel Welded/Seamless
- API 5L GR.B - Line Pipe
- ASTM A312 - Stainless Steel
- ASME B36.10 - Dimension Standard

**Common Additional Specs:**
- NACE MR0175 - Sulfide Stress Cracking Resistant
- NACE MR0103 - Hydrogen Service
- H2 SERVICE - Hydrogen environments

### 10.3 Data Migration

**Files to Import:**

1. **PIPES_SIZE_MASTER_CS___AS_PIPES.xlsx**
   - 192 rows
   - Columns: Size, OD (mm), WT (mm), Weight (kg/m)

2. **PIPES_SIZE_MASTER_SS___DS_PIPES.xlsx**
   - 81 rows
   - Columns: Size, OD (mm), WT (mm), Weight (kg/m)

3. **PRODUCT_SPEC_MASTER_-_1.xlsx**
   - 246 rows
   - Columns: Product, Material, Additional Spec, Ends, Length

4. **INVENTORY_MASTER_-_LATEST.xlsx**
   - 55 rows
   - Columns: Form, Product, Specification, Additional, Dimension, Size, Ends, Length, Heat No., Make, Quantity, Piece, MTC No., MTC Date

5. **TESTING_MASTER_FOR_LAB_LETTER.xlsx**
   - 12 test types
   - Column: Testing to be performed

### 10.4 Reference Documents

- Standard_quotation.pdf (quotation format reference)
- ERP_CHANGES.docx (change requests)
- SteelERP_Gap_Analysis.docx (gap analysis)
- Formal SRS FRD ISO 9001 Alignment ERP Strategy Document.docx
- ERP Screen Mapping - SOP to System Functional Mapping.docx
- ERP Software Requirement & ISO 9001 Compliance Report.docx

### 10.5 Contact

**Stakeholders:**
- **Karan Patil** - Business Owner (karan@npipe.com)
- **Uttam Sir** - Operations Head (uttam@npipe.com)

**Development Team:**
- Lead Developer
- Backend Developer
- Frontend Developer
- QA Engineer

**Project Manager:**
- Track progress
- Weekly status meetings
- Issue resolution

---

## CHANGE LOG

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-07 | Initial draft based on analysis | Dev Team |
| 2.0 | 2026-02-07 | Incorporated Karan Patil's 12 requirements + meeting notes | Dev Team |

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

*This document is subject to change based on stakeholder feedback and technical discoveries during implementation.*
