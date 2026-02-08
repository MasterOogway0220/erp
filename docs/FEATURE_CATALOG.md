# ERP System - Feature Catalog

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Implementation Status:** Phase 14 Complete

---

## Table of Contents
1. [Feature Status Overview](#feature-status-overview)
2. [Sales Module Features](#sales-module-features)
3. [Purchase Module Features](#purchase-module-features)
4. [Inventory Module Features](#inventory-module-features)
5. [Finance Module Features](#finance-module-features)
6. [Quality Control Features](#quality-control-features)
7. [Admin & Settings Features](#admin--settings-features)
8. [Reports & MIS Features](#reports--mis-features)
9. [User Flows](#user-flows)
10. [Forms Documentation](#forms-documentation)

---

## Feature Status Overview

### Implemented Features (100%)
- ✅ Sales: Enquiries, Quotations, Sales Orders
- ✅ Purchase: Purchase Orders, GRNs
- ✅ Inventory: Stock Management, FIFO Allocation, Dispatches
- ✅ Finance: Invoices, Payment Receipts, Allocations
- ✅ Quality: Inspections, NCRs, MTC Tracking
- ✅ Admin: Audit Logs, Settings, Multi-Company
- ✅ Reports: Dashboard KPIs, MIS Reports, Aging Analysis

### Partially Implemented Features
- ⚠️ **Dispatch Planning Interface**: UI exists but lacks advanced features (route optimization, vehicle scheduling)
- ⚠️ **Multi-Currency Support**: Schema supports it, but UI/calculations incomplete
- ⚠️ **Role-Based Access Control**: Not implemented (all users have full access)

### Planned Features (Not Started)
- ❌ Work Orders Module
- ❌ Production Planning
- ❌ Advanced Analytics (predictive forecasting)
- ❌ Mobile App
- ❌ API Rate Limiting
- ❌ Two-Factor Authentication

### Deprecated Features
- None (all implemented features are active)

---

## Sales Module Features

### 1. Enquiry Management

**Purpose**: Track customer enquiries (RFQs) and convert to quotations

**User Flow**:
1. Sales team receives enquiry from customer
2. Navigate to `/sales/enquiries` → Click "New Enquiry"
3. Select customer and buyer contact
4. Add product line items with quantities
5. Save enquiry (status: 'open')
6. Click "Convert to Quotation" when ready

**Pages/Screens**:
- `/sales/enquiries` - List view with filters
- `/sales/enquiries/new` - Creation form
- `/sales/enquiries/[id]` - Detail view

**APIs Used**:
- `GET /api/enquiries` - List
- `POST /api/enquiries` - Create
- `GET /api/enquiries/[id]` - Detail
- `PATCH /api/enquiries/[id]` - Update status

**DB Tables**:
- `enquiries` (header)
- `enquiry_items` (line items)
- `customers`, `buyers`, `products` (lookups)

**Validation Rules**:
- Customer ID required
- At least 1 item required
- Quantity must be positive

**Edge Cases**:
- ✅ Enquiry without buyer (uses customer's primary contact)
- ✅ Custom product (not in master)
- ❌ Duplicate enquiry detection (NOT IMPLEMENTED)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No enquiry expiry tracking
- No automatic follow-up reminders
- No enquiry-to-quotation conversion rate analytics

---

### 2. Quotation Generation

**Purpose**: Create formal price quotations with terms & conditions

**User Flow**:
1. Navigate to `/sales/quotations` → Click "New Quotation"
2. Select quotation type (Standard/Non-Standard)
3. **Standard Quotation**:
   - Select customer, buyer, warehouse
   - Add products from master with specs
   - System auto-calculates weight, pricing
   - Add packing/freight charges
   - Select terms & conditions
   - For export: Select ports, vessel, testing standards
4. **Non-Standard Quotation**:
   - Enter custom product descriptions
   - Manual quantity/price entry
   - No auto-calculations
5. Save as draft → Submit for approval → Send to customer

**Pages/Screens**:
- `/sales/quotations` - List view
- `/sales/quotations/new` - Type selection
- `/sales/quotations/new/standard` - Standard form
- `/sales/quotations/new/non-standard` - Non-standard form
- `/sales/quotations/[id]` - Detail view with PDF export

**APIs Used**:
- `GET /api/quotations`
- `POST /api/quotations`
- `PATCH /api/quotations/[id]` - Status updates
- `GET /api/quotations/[id]/pdf` - PDF generation

**DB Tables**:
- `quotations` (header)
- `quotation_items` (line items)
- `quotation_terms` (T&C links)
- `quotation_testing` (testing standards)
- `product_specifications`, `pipe_sizes`, `ports`, `currencies`

**Validation Rules**:
- Customer ID required
- At least 1 item required
- Unit price >= 0
- Discount 0-100%
- Valid until date must be future
- For export: Port of loading/discharge required

**Edge Cases**:
- ✅ Quotation from enquiry (auto-populate items)
- ✅ Quotation revision (parent_quotation_id link)
- ✅ Multi-currency with exchange rate
- ⚠️ **Item totals can be zero** (CRITICAL BUG - form allows saving with zero prices if inputs not blurred)

**Known Bugs**:
1. **Zero Total Bug**: Quotation can be saved with total_amount = 0 if numeric inputs aren't properly triggered with `change` events
2. **Weight Calculation**: Auto-calculated weight sometimes doesn't update when size changes
3. **Port Cascading**: Changing port of loading doesn't filter port of discharge by country

**Missing Improvements**:
- No quotation comparison (side-by-side view of revisions)
- No email integration (must manually send PDF)
- No quotation acceptance tracking (customer signature)
- No automatic expiry status update (requires manual check)

---

### 3. Sales Order Management

**Purpose**: Manage confirmed customer orders

**User Flow**:
1. From approved quotation → Click "Create Sales Order"
2. Enter customer PO number and date
3. Confirm delivery terms and addresses
4. System copies items from quotation
5. Save SO (status: 'draft')
6. Confirm SO → Status changes to 'confirmed'
7. Track dispatch progress (pending → part_dispatched → dispatched → completed)

**Pages/Screens**:
- `/sales/orders` - List view with status filters
- `/sales/orders/new` - Creation form
- `/sales/orders/[id]` - Detail view with dispatch tracking

**APIs Used**:
- `GET /api/sales-orders`
- `POST /api/sales-orders`
- `PATCH /api/sales-orders/[id]`

**DB Tables**:
- `sales_orders` (header)
- `sales_order_items` (line items with status tracking)
- `quotations` (source)

**Validation Rules**:
- Customer PO number required
- Billing address required (JSONB)
- Shipping address required (JSONB)
- At least 1 item required

**Edge Cases**:
- ✅ Direct SO (without quotation)
- ✅ Partial dispatch (multiple dispatches for one SO)
- ✅ SO cancellation (status: 'cancelled')

**Known Bugs**:
- None critical

**Missing Improvements**:
- No SO amendment workflow (requires cancellation + new SO)
- No delivery date tracking per item
- No automatic PO to dispatch reminder

---

## Purchase Module Features

### 4. Purchase Order Management

**Purpose**: Create orders to vendors for material procurement

**User Flow**:
1. Navigate to `/purchase/orders` → Click "New PO"
2. Select vendor
3. Optionally link to sales order (for direct procurement)
4. Add products with quantities and prices
5. Enter expected heat numbers
6. Set delivery date
7. Save PO → Approve → Send to vendor

**Pages/Screens**:
- `/purchase/orders` - List view
- `/purchase/orders/new` - Creation form
- `/purchase/orders/[id]` - Detail view

**APIs Used**:
- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `PATCH /api/purchase-orders/[id]`

**DB Tables**:
- `purchase_orders` (header)
- `purchase_order_items` (line items with received_quantity tracking)
- `vendors`, `sales_orders` (links)

**Validation Rules**:
- Vendor ID required
- Delivery date required
- At least 1 item required
- Quantity > 0, unit_price >= 0

**Edge Cases**:
- ✅ Stock PO (not linked to SO)
- ✅ Partial receipt (multiple GRNs for one PO)
- ✅ Over-receipt (received > ordered)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No PO approval workflow (multi-level)
- No vendor comparison (price quotes)
- No automatic PO generation from reorder levels

---

### 5. Goods Receipt Note (GRN)

**Purpose**: Record received inventory with MTC verification (ISO 7.5.3)

**User Flow**:
1. Navigate to `/inventory/grn/new`
2. Select purchase order
3. Select warehouse
4. For each item:
   - Enter received quantity
   - Enter heat number (mandatory)
5. Upload MTC document (PDF - mandatory for ISO compliance)
6. Enter receiver name
7. Save GRN → Creates inventory records with status 'pending_inspection'

**Pages/Screens**:
- `/inventory/grn` - List view
- `/inventory/grn/new` - Creation form

**APIs Used**:
- `POST /api/grn`
- `GET /api/grn`

**DB Tables**:
- `grns` (header)
- `grn_items` (line items)
- `inventory` (created automatically)
- `purchase_orders` (source)

**Validation Rules**:
- PO ID required
- Warehouse ID required
- MTC file URL required (ISO 7.5.3)
- Heat number required for each item
- Received quantity >= 0

**Edge Cases**:
- ✅ Short receipt (received < ordered)
- ✅ Over receipt (received > ordered)
- ✅ Multiple GRNs for same PO
- ❌ Duplicate heat numbers across GRNs (NOT VALIDATED)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No MTC auto-parsing (extract data from PDF)
- No heat number uniqueness validation
- No automatic QC assignment

---

## Inventory Module Features

### 6. Stock Management with FIFO

**Purpose**: Track inventory by heat number with FIFO allocation

**User Flow** (View Only):
1. Navigate to `/inventory/stock`
2. View available stock by product
3. Filter by warehouse, status, heat number
4. See FIFO order (oldest GRN first)

**Pages/Screens**:
- `/inventory/stock` - List view with filters

**APIs Used**:
- `GET /api/inventory`

**DB Tables**:
- `inventory` (main table)
- `grns` (source with grn_date for FIFO)
- `products`, `warehouses`

**Validation Rules**:
- N/A (view only)

**Edge Cases**:
- ✅ Negative stock (allocated > quantity) - Prevented by validation
- ✅ Multiple batches of same product (different heat numbers)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No stock transfer between warehouses
- No stock adjustment workflow (requires manual SQL)
- No reorder level alerts

---

### 7. Dispatch Planning

**Purpose**: Create outbound shipments with FIFO allocation

**User Flow**:
1. Navigate to `/inventory/dispatch/new`
2. Select sales order
3. System shows pending items
4. For each item:
   - Enter quantity to dispatch
   - System auto-allocates from oldest inventory (FIFO)
   - Shows allocated heat numbers
5. Enter vehicle details (number, driver, LR, e-way bill)
6. Save dispatch → Updates inventory.allocated_quantity
7. Confirm dispatch → Status changes to 'dispatched'

**Pages/Screens**:
- `/inventory/dispatch` - List view
- `/inventory/dispatch/new` - Creation form with FIFO allocation

**APIs Used**:
- `POST /api/dispatch`
- `GET /api/dispatch`

**DB Tables**:
- `dispatches` (header)
- `dispatch_items` (line items with inventory_id links)
- `inventory` (FIFO source)
- `sales_orders` (source)

**Validation Rules**:
- SO ID required
- At least 1 item required
- Quantity must not exceed available inventory

**Edge Cases**:
- ✅ Partial dispatch (multiple dispatches for one SO)
- ✅ Mixed heat numbers in one dispatch
- ❌ **Insufficient stock** - Returns error, no partial allocation

**Known Bugs**:
- None critical

**Missing Improvements**:
- No route optimization
- No vehicle scheduling
- No GPS tracking integration
- No automatic e-way bill generation

---

## Finance Module Features

### 8. Invoice Generation

**Purpose**: Create GST-compliant invoices from dispatches

**User Flow**:
1. From dispatch detail page → Click "Create Invoice"
2. System auto-calculates:
   - Subtotal from dispatch items
   - GST (CGST+SGST for intra-state, IGST for inter-state)
   - Total amount
3. Set due date
4. Save invoice (status: 'draft')
5. Send to customer → Status changes to 'sent'
6. Track payment status (partial_paid → paid)

**Pages/Screens**:
- `/finance/invoices` - List view
- `/finance/invoices/new` - Creation form
- `/finance/invoices/[id]` - Detail view with PDF export

**APIs Used**:
- `POST /api/invoices`
- `GET /api/invoices`
- `GET /api/invoices/[id]/pdf`

**DB Tables**:
- `invoices` (header)
- `invoice_items` (line items)
- `dispatches` (source)
- `sales_orders`, `customers`

**Validation Rules**:
- Dispatch ID required
- Due date required

**Edge Cases**:
- ✅ Intra-state GST (CGST 9% + SGST 9%)
- ✅ Inter-state GST (IGST 18%)
- ❌ Multiple GST rates per invoice (NOT SUPPORTED)

**Known Bugs**:
- GST rates hardcoded (should be configurable)
- Place of supply not validated

**Missing Improvements**:
- No e-invoice integration (GST portal)
- No automatic email delivery
- No invoice cancellation workflow

---

### 9. Payment Receipt & Allocation

**Purpose**: Record customer payments and allocate to invoices

**User Flow**:
1. Navigate to `/finance/payments/new`
2. Select customer
3. Enter payment details (amount, mode, reference)
4. Allocate to invoices:
   - Select invoice
   - Enter allocation amount
   - Repeat for multiple invoices
5. Save receipt → Updates invoice.paid_amount
6. Invoice status auto-updates (partial_paid/paid)

**Pages/Screens**:
- `/finance/payments` - List view
- `/finance/payments/new` - Creation form with allocation

**APIs Used**:
- `POST /api/payments`
- `GET /api/payments`

**DB Tables**:
- `payment_receipts` (header)
- `payment_receipt_items` (allocations)
- `invoices` (updated)

**Validation Rules**:
- Customer ID required
- Amount > 0
- Payment mode required (enum)
- Allocations must sum to payment amount
- Cannot over-allocate (allocated > invoice outstanding)

**Edge Cases**:
- ✅ Partial payment (one payment → multiple invoices)
- ✅ Advance payment (payment without allocation)
- ❌ Refunds (NOT SUPPORTED)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No bank reconciliation
- No payment reminders
- No automatic allocation (FIFO by invoice date)

---

## Quality Control Features

### 10. QC Inspection

**Purpose**: Inspect received inventory against specifications

**User Flow**:
1. Navigate to `/inventory/qc/new`
2. Select GRN (status: 'pending_inspection')
3. Select inventory batch (by heat number)
4. For each test parameter:
   - Enter specification
   - Enter actual value
   - Mark pass/fail
5. Enter overall result (accepted/rejected/hold)
6. Save inspection → Updates inventory.status

**Pages/Screens**:
- `/inventory/qc` - List view
- `/inventory/qc/new` - Inspection form

**APIs Used**:
- `POST /api/qc`
- `GET /api/qc`

**DB Tables**:
- `inspections` (header)
- `inspection_test_results` (test parameters)
- `testing_standards` (lookup)
- `inventory` (updated)

**Validation Rules**:
- GRN ID required
- Inventory ID required
- Result required (enum)

**Edge Cases**:
- ✅ Re-inspection (after hold)
- ✅ Partial acceptance (some batches accepted, some rejected)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No automatic test result import (from lab equipment)
- No statistical process control (SPC) charts
- No automatic NCR creation for failures

---

### 11. Non-Conformance Reports (NCR)

**Purpose**: Track quality issues with RCA and CAPA

**User Flow**:
1. Navigate to `/qc/ncr/new`
2. Enter issue description
3. Link to product/heat number
4. Save NCR (status: 'open')
5. Conduct root cause analysis:
   - Select RCA method (5-Why, Fishbone, etc.)
   - Enter root cause
6. Define corrective action
7. Define preventive action
8. Set target closure date
9. Close NCR when actions complete

**Pages/Screens**:
- `/qc/ncr` - List view
- `/qc/ncr/new` - Creation form
- `/qc/ncr/[id]` - Detail view with RCA

**APIs Used**:
- `POST /api/ncr`
- `GET /api/ncr`
- `PATCH /api/ncr/[id]`

**DB Tables**:
- `ncrs` (all fields in one table)

**Validation Rules**:
- Description required
- Status transitions: open → under_investigation → action_taken → closed

**Edge Cases**:
- ✅ NCR without product (process issue)
- ✅ NCR reopening (if action ineffective)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No NCR recurrence tracking
- No automatic CAPA effectiveness verification
- No NCR cost tracking

---

## Admin & Settings Features

### 12. Audit Logs (ISO 9001:2018)

**Purpose**: Complete traceability of all system changes

**User Flow** (View Only):
1. Navigate to `/admin/audit-logs`
2. Filter by table, action, date range
3. View old vs new data (JSON diff)
4. Export for audits

**Pages/Screens**:
- `/admin/audit-logs` - List view with filters and JSON diff modal

**APIs Used**:
- `GET /api/admin/audit-logs`

**DB Tables**:
- `audit_logs` (all actions)

**Validation Rules**:
- N/A (auto-generated)

**Edge Cases**:
- ✅ Bulk operations (multiple audit entries)
- ✅ Deleted records (old_data preserved)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No audit log retention policy
- No automatic archival
- No tamper-proof signatures

---

### 13. Unified Settings

**Purpose**: Manage company profile, addresses, ISO policies

**User Flow**:
1. Navigate to `/settings`
2. Tabs:
   - **Company Profile**: Edit name, GSTIN, PAN, logo
   - **Addresses**: Manage multi-GSTIN addresses
   - **ISO Policies**: Configure quality policies
   - **System Preferences**: (placeholder)
3. Save changes → Audit log created

**Pages/Screens**:
- `/settings` - Tabbed interface

**APIs Used**:
- `GET /api/companies/[id]`
- `PATCH /api/companies/[id]`
- `GET /api/companies/[id]/addresses`
- `POST /api/companies/[id]/addresses`

**DB Tables**:
- `companies`
- `company_addresses`

**Validation Rules**:
- Company name required
- GSTIN format: 15 chars (99AAAAA9999A9Z9)
- PAN format: 10 chars (AAAAA9999A)

**Edge Cases**:
- ✅ Multi-GSTIN (multiple addresses with different GSTINs)

**Known Bugs**:
- None critical

**Missing Improvements**:
- No user management (add/remove users)
- No role assignment
- No system-wide preferences (date format, currency)

---

## Reports & MIS Features

### 14. Dashboard KPIs

**Purpose**: Real-time business metrics

**User Flow** (Auto-Load):
1. Navigate to `/dashboard`
2. View KPI cards:
   - Total Sales Orders (count + value)
   - Pending Dispatches
   - Total Inventory Value
   - Receivables Outstanding
3. View charts:
   - Sales trend (last 6 months)
   - Top customers
   - Top products

**Pages/Screens**:
- `/dashboard` - Main dashboard

**APIs Used**:
- `GET /api/dashboard`

**DB Tables**:
- All transactional tables (aggregated)

**Validation Rules**:
- N/A (read-only)

**Edge Cases**:
- ✅ Empty state (no data)

**Known Bugs**:
- **Slow load time** (2-3s due to sequential aggregations)

**Missing Improvements**:
- No caching (Redis)
- No real-time updates (WebSocket)
- No customizable widgets

---

### 15. MIS Reports

**Purpose**: Analytical reports for management

**Available Reports**:
1. **PO Aging Analysis**: Pending POs by days open (0-3, 7, 15, 30, 30+)
2. **Payment Ageing**: Receivables by age buckets
3. **Top Customers**: By order count and value
4. **Top Products**: By sales volume
5. **Vendor Scorecard**: Rating, total POs, completion rate
6. **Order Status Summary**: SO count by status
7. **Invoice Status Summary**: Invoice count by status
8. **Quality Metrics**: NCR count, inspection pass rate

**User Flow**:
1. Navigate to `/reports`
2. View all reports on one page
3. Export to CSV (individual reports)

**Pages/Screens**:
- `/reports` - All reports in one view

**APIs Used**:
- `GET /api/reports/po-aging`
- `GET /api/reports/payment-aging`
- `GET /api/reports/top-customers`
- etc.

**DB Tables**:
- All transactional tables

**Validation Rules**:
- N/A (read-only)

**Edge Cases**:
- ✅ No data (shows zero values)

**Known Bugs**:
- **Layout regressions** (fixed in Phase 14)

**Missing Improvements**:
- No date range filters
- No drill-down (click to see details)
- No scheduled email delivery

---

## User Flows

### Complete Sales Cycle

```
1. Customer Enquiry
   ↓
2. Create Enquiry (ENQ/STC/2025/0001)
   ↓
3. Convert to Quotation (QTN/STC/2025/0001)
   ↓
4. Add items, pricing, terms
   ↓
5. Submit for approval
   ↓
6. Approve quotation
   ↓
7. Send to customer
   ↓
8. Customer accepts
   ↓
9. Create Sales Order (SO/STC/2025/0001)
   ↓
10. Confirm SO
```

### Complete Purchase-to-Dispatch Cycle

```
1. Create Purchase Order (PO/STC/2025/0001)
   ↓
2. Send to vendor
   ↓
3. Vendor delivers material
   ↓
4. Create GRN (GRN/STC/2025/0001)
   ↓
5. Upload MTC document
   ↓
6. Inventory created (status: pending_inspection)
   ↓
7. QC Inspection
   ↓
8. Mark as accepted
   ↓
9. Inventory status → available
   ↓
10. Create Dispatch (DSP/STC/2025/0001)
   ↓
11. FIFO allocation from inventory
   ↓
12. Enter vehicle details
   ↓
13. Confirm dispatch
   ↓
14. Inventory status → dispatched
```

### Complete Finance Cycle

```
1. Dispatch confirmed
   ↓
2. Create Invoice (INV/STC/2025/0001)
   ↓
3. System calculates GST
   ↓
4. Send invoice to customer
   ↓
5. Customer makes payment
   ↓
6. Create Payment Receipt (RCP/STC/2025/0001)
   ↓
7. Allocate to invoices
   ↓
8. Invoice status → paid
```

---

## Forms Documentation

### Quotation Form (Standard)

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Customer | Dropdown | Yes | Must exist in customers table | - |
| Buyer | Dropdown | No | Must belong to selected customer | Primary contact |
| Quotation Type | Radio | Yes | STANDARD, NON_STANDARD | STANDARD |
| Project Name | Text | No | Max 255 chars | - |
| Warehouse | Dropdown | Yes | Must exist in warehouses table | - |
| Currency | Dropdown | Yes | Must exist in currencies table | INR |
| Exchange Rate | Number | Yes | > 0 | 1 |
| Validity Days | Number | Yes | > 0 | 15 |
| Valid Until | Date | Yes | Must be future | Calculated from validity_days |
| Port of Loading | Dropdown | No | For export only | - |
| Port of Discharge | Dropdown | No | For export only | - |
| Vessel Name | Text | No | Max 255 chars | - |
| Testing Standards | Multi-select | No | - | [] |
| Packing Charges | Number | No | >= 0 | 0 |
| Freight Charges | Number | No | >= 0 | 0 |
| Other Charges | Number | No | >= 0 | 0 |
| Remarks | Textarea | No | - | - |

**Line Items**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Product | Dropdown | Yes | Must exist in products table |
| Product Spec | Dropdown | No | Must belong to product |
| Pipe Size | Dropdown | No | For pipes only |
| Quantity | Number | Yes | > 0 |
| Unit Price | Number | Yes | >= 0 |
| Discount | Number | No | 0-100 |
| Size | Text | No | Auto-filled from pipe_size |
| Schedule | Text | No | Auto-filled from pipe_size |
| Wall Thickness | Number | No | Auto-calculated |
| Weight per Mtr | Number | No | Auto-calculated |
| Total Weight | Number | No | Auto-calculated |
| Grade | Text | No | Auto-filled from spec |

**API Endpoint**: `POST /api/quotations`

**Known Issues**:
- Total can be zero if inputs not blurred

---

### Sales Order Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Quotation | Dropdown | No | If provided, auto-fills items | - |
| Customer | Dropdown | Yes | Must exist | - |
| Buyer | Dropdown | Yes | Must belong to customer | - |
| Customer PO Number | Text | Yes | Min 1 char | - |
| Customer PO Date | Date | Yes | - | - |
| Order Date | Date | Yes | - | Today |
| Payment Terms | Textarea | No | - | From customer master |
| Delivery Terms | Textarea | No | - | - |
| Billing Address | JSON | Yes | Must have line1, city, state, pincode | From customer |
| Shipping Address | JSON | Yes | Must have line1, city, state, pincode | From customer |
| Currency | Dropdown | Yes | - | INR |
| Remarks | Textarea | No | - | - |

**API Endpoint**: `POST /api/sales-orders`

---

### GRN Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Purchase Order | Dropdown | Yes | Must exist | - |
| Warehouse | Dropdown | Yes | Must exist | - |
| Received By | Text | Yes | Min 1 char | - |
| MTC Document | File Upload | Yes | PDF only (ISO 7.5.3) | - |
| Remarks | Textarea | No | - | - |

**Line Items** (auto-populated from PO):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Product | Display | - | From PO | - |
| Ordered Quantity | Display | - | From PO | - |
| Received Quantity | Number | Yes | >= 0 | - |
| Heat Number | Text | Yes | Min 1 char | - |

**API Endpoint**: `POST /api/grn`

---

### Payment Receipt Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Customer | Dropdown | Yes | Must exist | - |
| Amount | Number | Yes | > 0 | - |
| Payment Mode | Dropdown | Yes | cash, cheque, neft, rtgs, upi, wire | - |
| Reference Number | Text | No | - | - |
| Receipt Date | Date | Yes | - | Today |
| Bank Details | Textarea | No | - | - |
| Remarks | Textarea | No | - | - |

**Allocations**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Invoice | Dropdown | Yes | Must belong to customer | - |
| Amount | Number | Yes | > 0, <= invoice outstanding | - |

**Validation**: Sum of allocations must equal payment amount

**API Endpoint**: `POST /api/payments`

---

**End of Feature Catalog**
