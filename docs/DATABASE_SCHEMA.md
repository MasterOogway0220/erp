# ERP System - Database Schema Documentation

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Total Tables:** 50+  
**Total Migrations:** 42 SQL files

---

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Core Master Tables](#core-master-tables)
3. [Sales Module Tables](#sales-module-tables)
4. [Purchase Module Tables](#purchase-module-tables)
5. [Inventory Module Tables](#inventory-module-tables)
6. [Finance Module Tables](#finance-module-tables)
7. [Quality Control Tables](#quality-control-tables)
8. [Admin & Audit Tables](#admin--audit-tables)
9. [Entity Relationship Diagram](#entity-relationship-diagram)
10. [Indexes & Constraints](#indexes--constraints)

---

## Schema Overview

### Database Type
- **RDBMS**: PostgreSQL 15+
- **Hosting**: Supabase (AWS US-East-2)
- **Extensions**: uuid-ossp, pg_trgm (for fuzzy search)

### Design Principles
1. **Multi-Company**: All transactional tables have `company_id` for tenant isolation
2. **Audit Trail**: `created_at`, `updated_at`, `created_by` on all tables
3. **Soft Deletes**: Not implemented (hard deletes with CASCADE)
4. **Normalization**: 3NF with denormalization for performance (e.g., buyer metrics)
5. **UUID Primary Keys**: All tables use UUIDs for distributed systems compatibility

### Table Categories
- **Master Data** (10 tables): Companies, Customers, Vendors, Products, Employees
- **Sales** (8 tables): Enquiries, Quotations, Sales Orders
- **Purchase** (6 tables): Purchase Requests, Purchase Orders, GRNs
- **Inventory** (5 tables): Stock, Transactions, Dispatches
- **Finance** (6 tables): Invoices, Payments, Allocations
- **Quality** (7 tables): Inspections, NCRs, MTCs, Testing Standards
- **Admin** (8 tables): Audit Logs, Notifications, Settings

---

## Core Master Tables

### 1. companies
**Purpose**: Multi-company master for legal entities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Company legal name |
| company_type | VARCHAR(50) | NOT NULL, CHECK | Proprietorship, Partnership, LLP, Limited, Pvt Ltd, HUF |
| code | VARCHAR(10) | UNIQUE | Short code for document numbering (e.g., 'STC') |
| gstin | VARCHAR(15) | | GST Identification Number |
| pan | VARCHAR(10) | | Permanent Account Number |
| tan | VARCHAR(10) | | Tax Deduction Account Number |
| cin | VARCHAR(21) | | Corporate Identification Number |
| email | VARCHAR(255) | | Primary email |
| website | VARCHAR(255) | | Company website |
| telephone | VARCHAR(50) | | Landline number |
| mobile | VARCHAR(50) | | Mobile number |
| registered_address_line1 | TEXT | | Registered office address |
| registered_city | VARCHAR(100) | | City |
| registered_state | VARCHAR(100) | | State |
| registered_pincode | VARCHAR(20) | | PIN code |
| warehouse_address_line1 | TEXT | | Warehouse address |
| current_financial_year | VARCHAR(20) | | e.g., '2025-2026' |
| is_active | BOOLEAN | DEFAULT true | Active status |
| logo_url | TEXT | | Company logo (Supabase Storage) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**
- `idx_companies_name` ON (name)
- `idx_companies_code` ON (code)

**Why This Table Exists**: Supports multi-company operations where one ERP instance manages multiple legal entities (e.g., parent company + subsidiaries).

---

### 2. employees
**Purpose**: Employee master linked to auth users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| user_id | UUID | FK auth.users(id), UNIQUE | Supabase auth user |
| employee_code | VARCHAR(50) | | Internal employee ID |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | | |
| email | VARCHAR(255) | NOT NULL, UNIQUE | |
| mobile | VARCHAR(20) | | |
| telephone | VARCHAR(20) | | |
| department | VARCHAR(50) | CHECK | Sales, Purchase, Quality, Warehouse, Accounts, Admin, Management |
| designation | VARCHAR(100) | | Job title |
| reporting_manager_id | UUID | FK employees(id) | Self-referencing |
| date_of_joining | DATE | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**
- `idx_employees_company` ON (company_id)
- `idx_employees_user` ON (user_id)
- `idx_employees_email` ON (email)

**Why This Table Exists**: Links Supabase auth users to company employees for RLS policies and audit trails.

---

### 3. customers
**Purpose**: Customer master data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| name | VARCHAR(255) | NOT NULL | Customer name |
| customer_code | VARCHAR(50) | | Internal code |
| customer_type | VARCHAR(50) | | Domestic, Export, Government |
| gstin | VARCHAR(15) | | Customer GSTIN |
| pan | VARCHAR(10) | | Customer PAN |
| email | VARCHAR(255) | | |
| telephone | VARCHAR(50) | | |
| mobile | VARCHAR(50) | | |
| billing_address_line1 | TEXT | | |
| billing_city | VARCHAR(100) | | |
| billing_state | VARCHAR(100) | | |
| billing_pincode | VARCHAR(20) | | |
| billing_country | VARCHAR(100) | DEFAULT 'India' | |
| shipping_address_line1 | TEXT | | |
| shipping_city | VARCHAR(100) | | |
| shipping_state | VARCHAR(100) | | |
| payment_terms | TEXT | | e.g., '30 days from invoice date' |
| credit_limit | DECIMAL(15,2) | | Maximum outstanding allowed |
| opening_balance | DECIMAL(15,2) | DEFAULT 0 | Initial ledger balance |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**
- `idx_customers_company` ON (company_id)
- `idx_customers_name` ON (name)
- `idx_customers_gstin` ON (gstin)

---

### 4. buyers
**Purpose**: Buyer contacts within customer organizations (ISO 8.2.1 requirement)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| customer_id | UUID | FK customers(id) | Parent customer |
| name | VARCHAR(255) | NOT NULL | Buyer name |
| designation | VARCHAR(100) | | Job title |
| email | VARCHAR(255) | | |
| mobile | VARCHAR(20) | | |
| telephone | VARCHAR(20) | | |
| is_primary_contact | BOOLEAN | DEFAULT false | |
| total_orders | INTEGER | DEFAULT 0 | Denormalized count |
| total_value | DECIMAL(15,2) | DEFAULT 0 | Denormalized sum |
| last_order_date | DATE | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Triggers:**
- `update_buyer_performance` ON sales_orders (UPDATE): Auto-updates total_orders, total_value

**Why This Table Exists**: ISO 9001:2018 requires tracking specific buyer contacts for communication and relationship management.

---

### 5. vendors
**Purpose**: Supplier master data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| name | VARCHAR(255) | NOT NULL | Vendor name |
| vendor_code | VARCHAR(50) | | |
| gstin | VARCHAR(15) | | |
| pan | VARCHAR(10) | | |
| email | VARCHAR(255) | | |
| telephone | VARCHAR(50) | | |
| mobile | VARCHAR(50) | | |
| address_line1 | TEXT | | |
| city | VARCHAR(100) | | |
| state | VARCHAR(100) | | |
| pincode | VARCHAR(20) | | |
| payment_terms | TEXT | | |
| rating | DECIMAL(3,2) | | Vendor rating (0-5) |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 6. products
**Purpose**: Product catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| name | VARCHAR(255) | NOT NULL | Product name |
| product_code | VARCHAR(50) | | SKU |
| category | VARCHAR(100) | | e.g., 'Pipes', 'Plates', 'Valves' |
| hsn_code | VARCHAR(20) | | HSN code for GST |
| uom | VARCHAR(20) | | Unit of measure (e.g., 'MT', 'NOS') |
| description | TEXT | | |
| specifications | JSONB | | Technical specs |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 7. warehouses
**Purpose**: Warehouse/location master

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| name | VARCHAR(255) | NOT NULL | Warehouse name |
| code | VARCHAR(50) | | Short code |
| gstin | TEXT | | Warehouse-specific GSTIN (for inter-state) |
| address_line1 | TEXT | | |
| city | VARCHAR(100) | | |
| state | VARCHAR(100) | | |
| pincode | VARCHAR(20) | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Why This Table Exists**: Multi-warehouse support for companies with multiple locations. GSTIN per warehouse enables correct GST calculation.

---

## Sales Module Tables

### 8. enquiries
**Purpose**: Customer enquiries (RFQs)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| customer_id | UUID | FK customers(id) | |
| buyer_id | UUID | FK buyers(id) | Specific buyer contact |
| enquiry_number | VARCHAR(50) | NOT NULL | Format: ENQ/STC/2025/0001 |
| enquiry_date | DATE | DEFAULT CURRENT_DATE | |
| status | VARCHAR(50) | DEFAULT 'open' | open, quoted, closed |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_enquiry_number_company` (company_id, enquiry_number)

---

### 9. enquiry_items
**Purpose**: Line items for enquiries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| enquiry_id | UUID | FK enquiries(id) CASCADE | |
| product_id | UUID | FK products(id) | |
| quantity | DECIMAL(12,3) | NOT NULL | |
| specifications | TEXT | | Custom specs |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 10. quotations
**Purpose**: Formal price quotations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| enquiry_id | UUID | FK enquiries(id) | Nullable (can be standalone) |
| customer_id | UUID | FK customers(id) | |
| buyer_id | UUID | FK buyers(id) | |
| quotation_number | VARCHAR(50) | NOT NULL | Format: QTN/STC/2025/0001 |
| quotation_date | DATE | DEFAULT CURRENT_DATE | |
| quotation_type | VARCHAR(50) | DEFAULT 'STANDARD' | STANDARD, NON_STANDARD |
| project_name | VARCHAR(255) | | Customer project reference |
| currency | VARCHAR(10) | DEFAULT 'INR' | |
| exchange_rate | DECIMAL(10,4) | DEFAULT 1 | For foreign currency |
| valid_until | DATE | | Quotation expiry date |
| validity_days | INTEGER | DEFAULT 15 | |
| status | VARCHAR(50) | DEFAULT 'draft' | draft, pending_approval, approved, sent, accepted, rejected, expired |
| subtotal | DECIMAL(15,2) | DEFAULT 0 | |
| packing_charges | DECIMAL(15,2) | DEFAULT 0 | |
| freight_charges | DECIMAL(15,2) | DEFAULT 0 | |
| other_charges | DECIMAL(15,2) | DEFAULT 0 | |
| total_amount | DECIMAL(15,2) | DEFAULT 0 | |
| total_weight | DECIMAL(12,3) | DEFAULT 0 | For freight calculation |
| port_of_loading_id | UUID | FK ports(id) | For export quotations |
| port_of_discharge_id | UUID | FK ports(id) | |
| vessel_name | VARCHAR(255) | | |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_quotation_number_company` (company_id, quotation_number)

---

### 11. quotation_items
**Purpose**: Line items for quotations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| quotation_id | UUID | FK quotations(id) CASCADE | |
| product_id | UUID | FK products(id) | Nullable for custom items |
| product_spec_id | UUID | FK product_specifications(id) | |
| pipe_size_id | UUID | FK pipe_sizes(id) | |
| product_name | VARCHAR(255) | | For non-standard items |
| description | TEXT | | |
| quantity | DECIMAL(12,3) | NOT NULL | |
| unit_price | DECIMAL(15,2) | NOT NULL | |
| discount | DECIMAL(5,2) | DEFAULT 0 | Percentage |
| total_amount | DECIMAL(15,2) | NOT NULL | |
| uom_id | UUID | FK units_of_measure(id) | |
| size | VARCHAR(100) | | Pipe size (e.g., '2 inch') |
| schedule | VARCHAR(50) | | Pipe schedule (e.g., 'SCH 40') |
| wall_thickness | DECIMAL(10,3) | | In mm |
| weight_per_mtr | DECIMAL(10,3) | | Kg/meter |
| total_weight | DECIMAL(12,3) | | Total weight for this item |
| grade | VARCHAR(100) | | Material grade (e.g., 'SS304') |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 12. sales_orders
**Purpose**: Confirmed customer orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| quotation_id | UUID | FK quotations(id) | Nullable (direct SO) |
| customer_id | UUID | FK customers(id) | |
| buyer_id | UUID | FK buyers(id) | |
| order_number | VARCHAR(50) | NOT NULL | Format: SO/STC/2025/0001 |
| order_date | DATE | DEFAULT CURRENT_DATE | |
| customer_po_number | VARCHAR(100) | NOT NULL | Customer's PO reference |
| customer_po_date | DATE | NOT NULL | |
| status | VARCHAR(50) | DEFAULT 'draft' | draft, confirmed, processing, ready_for_dispatch, part_dispatched, dispatched, completed, cancelled |
| currency | VARCHAR(10) | DEFAULT 'INR' | |
| total_amount | DECIMAL(15,2) | DEFAULT 0 | |
| payment_terms | TEXT | | |
| delivery_terms | TEXT | | |
| billing_address | JSONB | NOT NULL | Customer billing address |
| shipping_address | JSONB | NOT NULL | Consignee details |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_sales_order_number_company` (company_id, order_number)

**Indexes:**
- `idx_sales_orders_company` ON (company_id)
- `idx_sales_orders_customer` ON (customer_id)
- `idx_sales_orders_status` ON (status)

---

### 13. sales_order_items
**Purpose**: Line items for sales orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| sales_order_id | UUID | FK sales_orders(id) CASCADE | |
| quotation_item_id | UUID | | Link to quotation item |
| product_id | UUID | FK products(id) | |
| description | TEXT | NOT NULL | |
| quantity | DECIMAL(12,3) | NOT NULL | |
| unit_price | DECIMAL(15,2) | NOT NULL | |
| total_amount | DECIMAL(15,2) | NOT NULL | |
| uom | VARCHAR(20) | | |
| hsn_code | VARCHAR(20) | | |
| status | VARCHAR(50) | DEFAULT 'pending' | pending, allocated, dispatched, delivered |
| metadata | JSONB | | Specs, size, grade, etc. |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Purchase Module Tables

### 14. purchase_orders
**Purpose**: Orders to vendors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| vendor_id | UUID | FK vendors(id) | |
| sales_order_id | UUID | FK sales_orders(id) | Nullable (can be stock PO) |
| po_number | VARCHAR(50) | NOT NULL | Format: PO/STC/2025/0001 |
| po_date | DATE | DEFAULT CURRENT_DATE | |
| delivery_date | DATE | | Expected delivery |
| status | VARCHAR(50) | DEFAULT 'draft' | draft, approved, sent, partial_received, received, closed, cancelled |
| total_amount | DECIMAL(15,2) | DEFAULT 0 | |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_po_number_company` (company_id, po_number)

---

### 15. purchase_order_items
**Purpose**: Line items for purchase orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| purchase_order_id | UUID | FK purchase_orders(id) CASCADE | |
| product_id | UUID | FK products(id) | |
| so_item_id | UUID | FK sales_order_items(id) | Link to SO item |
| quantity | DECIMAL(12,3) | NOT NULL | |
| unit_price | DECIMAL(15,2) | NOT NULL | |
| total_amount | DECIMAL(15,2) | NOT NULL | |
| heat_number | VARCHAR(100) | | Expected heat number |
| received_quantity | DECIMAL(12,3) | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 16. grns (Goods Receipt Notes)
**Purpose**: Received inventory from vendors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| purchase_order_id | UUID | FK purchase_orders(id) | |
| warehouse_id | UUID | FK warehouses(id) | |
| grn_number | VARCHAR(50) | NOT NULL | Format: GRN/STC/2025/0001 |
| grn_date | DATE | DEFAULT CURRENT_DATE | |
| received_by | VARCHAR(255) | NOT NULL | Employee name |
| mtc_file_url | TEXT | NOT NULL | MTC document (ISO 7.5.3) |
| status | VARCHAR(50) | DEFAULT 'pending_inspection' | pending_inspection, inspected, completed |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique Constraint**: `uq_grn_number_company` (company_id, grn_number)

---

### 17. grn_items
**Purpose**: Line items for GRNs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| grn_id | UUID | FK grns(id) CASCADE | |
| purchase_order_item_id | UUID | FK purchase_order_items(id) | |
| product_id | UUID | FK products(id) | |
| received_quantity | DECIMAL(12,3) | NOT NULL | |
| heat_number | VARCHAR(100) | NOT NULL | Unique material identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Inventory Module Tables

### 18. inventory
**Purpose**: Stock ledger with heat number tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| warehouse_id | UUID | FK warehouses(id) | |
| product_id | UUID | FK products(id) | |
| grn_id | UUID | FK grns(id) | Source GRN |
| heat_number | VARCHAR(100) | NOT NULL | Material traceability |
| quantity | DECIMAL(12,3) | NOT NULL | Available quantity |
| allocated_quantity | DECIMAL(12,3) | DEFAULT 0 | Reserved for dispatch |
| status | VARCHAR(50) | DEFAULT 'available' | available, allocated, dispatched, rejected |
| mtc_reference | VARCHAR(255) | | MTC document reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**
- `idx_inventory_product` ON (product_id)
- `idx_inventory_warehouse` ON (warehouse_id)
- `idx_inventory_heat_number` ON (heat_number)
- `idx_inventory_status` ON (status)

**Why This Table Exists**: FIFO inventory allocation requires tracking individual batches by heat number and GRN date.

---

### 19. inventory_transactions
**Purpose**: Audit trail for inventory movements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| inventory_id | UUID | FK inventory(id) | |
| transaction_type | VARCHAR(50) | NOT NULL | IN, OUT, ADJUST |
| quantity | DECIMAL(12,3) | NOT NULL | Positive or negative |
| reference_type | VARCHAR(50) | | GRN, DISPATCH, ADJUSTMENT |
| reference_id | UUID | | ID of source document |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

---

### 20. dispatches
**Purpose**: Outbound shipments to customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| sales_order_id | UUID | FK sales_orders(id) | |
| dispatch_number | VARCHAR(50) | NOT NULL | Format: DSP/STC/2025/0001 |
| dispatch_date | DATE | DEFAULT CURRENT_DATE | |
| vehicle_number | VARCHAR(100) | | |
| driver_name | VARCHAR(100) | | |
| driver_phone | VARCHAR(20) | | |
| lr_number | VARCHAR(100) | | Lorry Receipt |
| eway_bill_number | VARCHAR(100) | | E-way bill for GST |
| consignee_address | JSONB | | Delivery address |
| status | VARCHAR(50) | DEFAULT 'pending' | pending, dispatched, delivered, cancelled |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_dispatch_number_company` (company_id, dispatch_number)

---

### 21. dispatch_items
**Purpose**: Line items for dispatches

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| dispatch_id | UUID | FK dispatches(id) CASCADE | |
| sales_order_item_id | UUID | FK sales_order_items(id) | |
| product_id | UUID | FK products(id) | |
| inventory_id | UUID | FK inventory(id) | Specific batch |
| quantity | DECIMAL(12,3) | NOT NULL | |
| heat_number | VARCHAR(100) | | |
| packaging_details | TEXT | | |
| net_weight | DECIMAL(12,3) | | |
| gross_weight | DECIMAL(12,3) | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Finance Module Tables

### 22. invoices
**Purpose**: Customer invoices with GST

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| dispatch_id | UUID | FK dispatches(id) | |
| sales_order_id | UUID | FK sales_orders(id) | |
| customer_id | UUID | FK customers(id) | |
| invoice_number | VARCHAR(50) | NOT NULL | Format: INV/STC/2025/0001 |
| invoice_date | DATE | DEFAULT CURRENT_DATE | |
| due_date | DATE | | Payment due date |
| currency | VARCHAR(10) | DEFAULT 'INR' | |
| subtotal | DECIMAL(15,2) | DEFAULT 0 | |
| cgst | DECIMAL(15,2) | DEFAULT 0 | Central GST |
| sgst | DECIMAL(15,2) | DEFAULT 0 | State GST |
| igst | DECIMAL(15,2) | DEFAULT 0 | Integrated GST |
| total_amount | DECIMAL(15,2) | DEFAULT 0 | |
| paid_amount | DECIMAL(15,2) | DEFAULT 0 | |
| billing_address | JSONB | | |
| shipping_address | JSONB | | |
| place_of_supply | VARCHAR(100) | | For GST calculation |
| status | VARCHAR(50) | DEFAULT 'draft' | draft, sent, partial_paid, paid, overdue, cancelled |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_invoice_number_company` (company_id, invoice_number)

---

### 23. invoice_items
**Purpose**: Line items for invoices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| invoice_id | UUID | FK invoices(id) CASCADE | |
| sales_order_item_id | UUID | FK sales_order_items(id) | |
| product_id | UUID | FK products(id) | |
| description | TEXT | | |
| quantity | DECIMAL(12,3) | NOT NULL | |
| unit_price | DECIMAL(15,2) | NOT NULL | |
| total_amount | DECIMAL(15,2) | NOT NULL | |
| hsn_code | VARCHAR(20) | | |
| heat_number | VARCHAR(100) | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 24. payment_receipts
**Purpose**: Customer payments received

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| customer_id | UUID | FK customers(id) | |
| receipt_number | VARCHAR(50) | NOT NULL | Format: RCP/STC/2025/0001 |
| receipt_date | DATE | DEFAULT CURRENT_DATE | |
| amount | DECIMAL(15,2) | NOT NULL | |
| payment_mode | VARCHAR(50) | | cash, cheque, neft, rtgs, upi, wire |
| reference_number | VARCHAR(100) | | Cheque/transaction number |
| bank_details | TEXT | | |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

**Unique Constraint**: `uq_receipt_number_company` (company_id, receipt_number)

---

### 25. payment_receipt_items
**Purpose**: Payment allocation to invoices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| payment_receipt_id | UUID | FK payment_receipts(id) CASCADE | |
| invoice_id | UUID | FK invoices(id) | |
| amount | DECIMAL(15,2) | NOT NULL | Allocated amount |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Why This Table Exists**: One payment can be allocated to multiple invoices (partial payments).

---

## Quality Control Tables

### 26. inspections
**Purpose**: QC inspection records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| grn_id | UUID | FK grns(id) | |
| inventory_id | UUID | FK inventory(id) | |
| inspection_number | VARCHAR(50) | NOT NULL | Format: INS/STC/2025/0001 |
| inspection_date | DATE | DEFAULT CURRENT_DATE | |
| inspector_name | VARCHAR(255) | | |
| result | VARCHAR(50) | | accepted, rejected, hold |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_by | UUID | FK auth.users(id) | |

---

### 27. inspection_test_results
**Purpose**: Individual test results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| inspection_id | UUID | FK inspections(id) CASCADE | |
| test_standard_id | UUID | FK testing_standards(id) | |
| parameter_name | VARCHAR(255) | | e.g., 'Tensile Strength' |
| specification | VARCHAR(255) | | e.g., '≥ 450 MPa' |
| actual_value | VARCHAR(255) | | Measured value |
| result | VARCHAR(50) | | pass, fail |
| remarks | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 28. ncrs (Non-Conformance Reports)
**Purpose**: Quality issue tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| company_id | UUID | FK companies(id) | |
| ncr_number | VARCHAR(50) | NOT NULL | Format: NCR/STC/2025/0001 |
| product_id | UUID | FK products(id) | |
| heat_number | VARCHAR(100) | | |
| description | TEXT | NOT NULL | Issue description |
| root_cause | TEXT | | RCA findings |
| rca_method | VARCHAR(50) | | 5-Why, Fishbone, etc. |
| corrective_action | TEXT | | |
| preventive_action | TEXT | | |
| status | VARCHAR(50) | DEFAULT 'open' | open, under_investigation, action_taken, closed |
| raised_by | VARCHAR(255) | | |
| closed_by | VARCHAR(255) | | |
| target_closure_date | DATE | | |
| closed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Unique Constraint**: `uq_ncr_number_company` (company_id, ncr_number)

---

## Admin & Audit Tables

### 29. audit_logs
**Purpose**: ISO 9001:2018 traceability (KP-11)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK auth.users(id) | |
| table_name | TEXT | NOT NULL | e.g., 'sales_orders' |
| record_id | TEXT | NOT NULL | UUID of modified record |
| action | TEXT | CHECK | CREATE, UPDATE, DELETE, STATUS_CHANGE |
| old_data | JSONB | | Previous state |
| new_data | JSONB | | New state |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:**
- `idx_audit_logs_table_record` ON (table_name, record_id)
- `idx_audit_logs_created_at` ON (created_at DESC)

**Why This Table Exists**: ISO 9001:2018 requires complete traceability of all system changes for quality audits.

---

### 30. notifications
**Purpose**: In-app notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK auth.users(id) | |
| title | VARCHAR(255) | NOT NULL | |
| message | TEXT | | |
| type | VARCHAR(50) | | info, warning, error, success |
| is_read | BOOLEAN | DEFAULT false | |
| link | TEXT | | Deep link to related record |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Entity Relationship Diagram

```
┌─────────────┐
│  companies  │
└──────┬──────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                                  ┌─────────────┐
│  employees  │                                  │  customers  │
└─────────────┘                                  └──────┬──────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │   buyers    │
                                                 └──────┬──────┘
                                                        │
       ┌────────────────────────────────────────────────┤
       │                                                │
       ▼                                                ▼
┌─────────────┐                                  ┌─────────────┐
│  enquiries  │──────────────────────────────────│ quotations  │
└──────┬──────┘                                  └──────┬──────┘
       │                                                │
       ▼                                                ▼
┌─────────────┐                                  ┌─────────────┐
│enquiry_items│                                  │quotation_   │
└─────────────┘                                  │   items     │
                                                 └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │sales_orders │
                                                 └──────┬──────┘
                                                        │
       ┌────────────────────────────────────────────────┼────────────┐
       │                                                │            │
       ▼                                                ▼            ▼
┌─────────────┐                                  ┌─────────────┐ ┌─────────────┐
│ purchase_   │                                  │ dispatches  │ │sales_order_ │
│   orders    │                                  └──────┬──────┘ │   items     │
└──────┬──────┘                                         │        └─────────────┘
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                                  ┌─────────────┐
│    grns     │                                  │  invoices   │
└──────┬──────┘                                  └──────┬──────┘
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                                  ┌─────────────┐
│ inventory   │                                  │  payment_   │
└──────┬──────┘                                  │  receipts   │
       │                                         └─────────────┘
       ▼
┌─────────────┐
│inspections  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    ncrs     │
└─────────────┘
```

---

## Indexes & Constraints

### Critical Indexes for Performance

**Foreign Key Indexes** (auto-created on all FKs):
- All `company_id` columns
- All `customer_id`, `vendor_id`, `product_id` columns
- All `*_order_id` columns

**Status Indexes** (for filtering):
- `idx_sales_orders_status` ON sales_orders(status)
- `idx_purchase_orders_status` ON purchase_orders(status)
- `idx_invoices_status` ON invoices(status)
- `idx_inventory_status` ON inventory(status)

**Date Indexes** (for reporting):
- `idx_audit_logs_created_at` ON audit_logs(created_at DESC)
- `idx_sales_orders_order_date` ON sales_orders(order_date)
- `idx_invoices_invoice_date` ON invoices(invoice_date)

**Search Indexes**:
- `idx_customers_name` ON customers(name)
- `idx_products_name` ON products(name)
- `idx_inventory_heat_number` ON inventory(heat_number)

### Unique Constraints

All document numbers have unique constraints:
```sql
CONSTRAINT uq_<table>_number_company UNIQUE (company_id, <number_column>)
```

Examples:
- `uq_sales_order_number_company` (company_id, order_number)
- `uq_invoice_number_company` (company_id, invoice_number)
- `uq_grn_number_company` (company_id, grn_number)

### Check Constraints

**Status Enums**:
```sql
CHECK (status IN ('draft', 'approved', 'sent', ...))
```

**Company Types**:
```sql
CHECK (company_type IN ('Proprietorship', 'Partnership', 'LLP', 'Limited', 'Pvt Ltd', 'HUF'))
```

**Departments**:
```sql
CHECK (department IN ('Sales', 'Purchase', 'Quality', 'Warehouse', 'Accounts', 'Admin', 'Management'))
```

---

## Database Functions & Triggers

### 1. get_next_sequence(p_prefix TEXT)
**Purpose**: Generate sequential document numbers

```sql
CREATE OR REPLACE FUNCTION get_next_sequence(p_prefix TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  -- Implementation uses sequences table
  -- Returns next number for given prefix
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;
```

### 2. update_buyer_performance()
**Purpose**: Auto-update buyer metrics on SO changes

```sql
CREATE TRIGGER update_buyer_metrics
AFTER INSERT OR UPDATE ON sales_orders
FOR EACH ROW
EXECUTE FUNCTION update_buyer_performance();
```

**CRITICAL BUG**: This trigger runs on EVERY sales order update, causing performance issues. Should be replaced with a cron job.

### 3. get_financial_year(p_date DATE)
**Purpose**: Calculate FY from date (April-March)

```sql
CREATE FUNCTION get_financial_year(p_date DATE)
RETURNS TEXT AS $$
BEGIN
  IF EXTRACT(MONTH FROM p_date) >= 4 THEN
    RETURN EXTRACT(YEAR FROM p_date)::TEXT || '-' || (EXTRACT(YEAR FROM p_date) + 1)::TEXT;
  ELSE
    RETURN (EXTRACT(YEAR FROM p_date) - 1)::TEXT || '-' || EXTRACT(YEAR FROM p_date)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Migration Strategy

### Applying Migrations

**Order**: Run files in numeric order (01 → 42)

```bash
psql $DATABASE_URL -f database_migrations/01_company_master.sql
psql $DATABASE_URL -f database_migrations/02_employee_master.sql
# ... continue through 42
```

**Rollback**: No automated rollback. Manual DROP TABLE required.

### Schema Versioning

**Current Version**: Phase 14 (42 migrations)

**Version Tracking**: No `schema_migrations` table (should be added)

---

## Known Schema Issues

1. **No Soft Deletes**: All deletes are hard deletes with CASCADE (data loss risk)
2. **Denormalized Buyer Metrics**: `total_orders`, `total_value` in buyers table can drift out of sync
3. **JSONB Overuse**: `metadata` columns lack schema validation
4. **Missing Composite Indexes**: No index on (company_id, status, created_at) for common queries
5. **No Partitioning**: Large tables (audit_logs, inventory_transactions) will slow down over time
6. **Weak RLS Policies**: Some tables use `USING (true)` instead of proper company filtering

---

**End of Database Schema Documentation**
