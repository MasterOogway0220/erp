# ERP System - API Documentation

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Base URL**: `http://localhost:3000/api` (development)  
**Total Endpoints:** 40+

---

## Table of Contents
1. [Authentication](#authentication)
2. [Common Patterns](#common-patterns)
3. [Sales Module APIs](#sales-module-apis)
4. [Purchase Module APIs](#purchase-module-apis)
5. [Inventory Module APIs](#inventory-module-apis)
6. [Finance Module APIs](#finance-module-apis)
7. [Master Data APIs](#master-data-apis)
8. [Admin APIs](#admin-apis)
9. [Error Codes](#error-codes)

---

## Authentication

### Method
- **Type**: JWT Bearer Token (Supabase Auth)
- **Storage**: HTTP-only cookies (automatic)
- **Header**: `Authorization: Bearer <token>`

### Login
**Endpoint**: `POST /api/auth/login`  
**Public**: Yes

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

### Logout
**Endpoint**: `POST /api/auth/logout`  
**Auth Required**: Yes

---

## Common Patterns

### Request Format
All POST/PUT requests expect JSON:
```
Content-Type: application/json
```

### Response Format
**Success** (200):
```json
{
  "data": { ... }
}
```

**Error** (4xx/5xx):
```json
{
  "error": "Error message"
}
```

### Pagination
**Not Implemented** - All list endpoints return full datasets (CRITICAL ISSUE)

**Recommended Query Params** (to be implemented):
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: created_at)
- `order`: asc/desc (default: desc)

### Filtering
Most list endpoints support:
- `status`: Filter by status
- `customer_id`: Filter by customer
- `vendor_id`: Filter by vendor
- `company_id`: Filter by company (auto-applied via RLS)

---

## Sales Module APIs

### 1. Enquiries

#### GET /api/enquiries
**Purpose**: List all enquiries

**Auth**: Required

**Query Params**:
- `status` (optional): open, quoted, closed
- `customer_id` (optional): UUID

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "enquiry_number": "ENQ/STC/2025/0001",
      "enquiry_date": "2025-01-15",
      "status": "open",
      "customer": {
        "id": "uuid",
        "name": "Tata Steel Ltd"
      },
      "buyer": {
        "id": "uuid",
        "name": "Rajesh Kumar"
      },
      "items": [
        {
          "product_id": "uuid",
          "quantity": 100,
          "specifications": "SS304, 2 inch"
        }
      ],
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/enquiries
**Purpose**: Create new enquiry

**Auth**: Required

**Request**:
```json
{
  "customer_id": "uuid",
  "buyer_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 100,
      "specifications": "SS304, 2 inch, SCH 40"
    }
  ],
  "remarks": "Urgent requirement"
}
```

**Validation** (Zod):
- `customer_id`: Required UUID
- `buyer_id`: Optional UUID
- `items`: Array, min 1 item
- `items[].product_id`: Required UUID
- `items[].quantity`: Required positive number

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "enquiry_number": "ENQ/STC/2025/0001",
    "status": "open",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Cases**:
- 401: User not authenticated
- 400: Validation failed (missing customer_id, empty items array)
- 404: Customer not found
- 500: Database error

---

### 2. Quotations

#### GET /api/quotations
**Purpose**: List all quotations

**Auth**: Required

**Query Params**:
- `status` (optional): draft, pending_approval, approved, sent, accepted, rejected, expired
- `customer_id` (optional): UUID

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "quotation_number": "QTN/STC/2025/0001",
      "quotation_date": "2025-01-15",
      "quotation_type": "STANDARD",
      "status": "approved",
      "customer": {
        "id": "uuid",
        "name": "Tata Steel Ltd"
      },
      "enquiry": {
        "id": "uuid",
        "enquiry_number": "ENQ/STC/2025/0001"
      },
      "items": [
        {
          "id": "uuid",
          "product_id": "uuid",
          "product_name": "SS304 Pipe",
          "quantity": 100,
          "unit_price": 500.00,
          "total_amount": 50000.00
        }
      ],
      "subtotal": 50000.00,
      "packing_charges": 1000.00,
      "freight_charges": 2000.00,
      "total_amount": 53000.00,
      "valid_until": "2025-01-30",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/quotations
**Purpose**: Create new quotation

**Auth**: Required

**Request**:
```json
{
  "customer_id": "uuid",
  "buyer_id": "uuid",
  "enquiry_id": "uuid",
  "quotation_type": "STANDARD",
  "project_name": "Pipeline Project Phase 2",
  "currency": "INR",
  "exchange_rate": 1,
  "validity_days": 15,
  "items": [
    {
      "product_id": "uuid",
      "product_spec_id": "uuid",
      "pipe_size_id": "uuid",
      "quantity": 100,
      "unit_price": 500.00,
      "discount": 5,
      "size": "2 inch",
      "schedule": "SCH 40",
      "wall_thickness": 3.91,
      "weight_per_mtr": 3.65,
      "total_weight": 365,
      "grade": "SS304"
    }
  ],
  "packing_charges": 1000.00,
  "freight_charges": 2000.00,
  "port_of_loading_id": "uuid",
  "port_of_discharge_id": "uuid",
  "vessel_name": "MV Shipping Vessel",
  "testing_standards": ["uuid1", "uuid2"],
  "remarks": "As per customer specs"
}
```

**Validation** (Zod):
- `customer_id`: Required UUID
- `quotation_type`: Required enum (STANDARD, NON_STANDARD)
- `items`: Array, min 1 item
- `items[].quantity`: Required positive number
- `items[].unit_price`: Required >= 0
- `items[].discount`: Optional 0-100
- `currency`: Default 'INR'
- `exchange_rate`: Default 1
- `validity_days`: Default 15

**Business Logic**:
1. Generate quotation number via `generateDocumentNumber('QTN', company_id)`
2. Calculate `valid_until` from `validity_days` if not provided
3. Calculate item totals: `(quantity * unit_price) * (1 - discount/100)`
4. Calculate quotation total: `sum(item_totals) + packing + freight + other`
5. Insert quotation header
6. Insert quotation items (bulk)
7. Link terms & conditions if provided
8. Link testing standards if provided
9. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "quotation_number": "QTN/STC/2025/0001",
    "status": "draft",
    "total_amount": 53000.00,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Cases**:
- 401: Unauthorized
- 400: Validation failed (e.g., "At least one item is required")
- 404: Customer not found
- 500: Database error, sequence generation failed

**Known Issues**:
- No validation for duplicate product_id in items array
- Total calculation doesn't account for GST (added at invoice stage)
- Exchange rate validation missing (should be > 0)

---

#### PATCH /api/quotations/[id]
**Purpose**: Update quotation status

**Auth**: Required

**Request**:
```json
{
  "status": "approved",
  "remarks": "Approved by management"
}
```

**Validation**:
- Status transition must be valid (see `statusTransitions` in schemas.ts)
- Example: draft → pending_approval → approved → sent

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "status": "approved",
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

**Error Cases**:
- 400: Invalid status transition (e.g., draft → sent without approval)
- 404: Quotation not found

---

### 3. Sales Orders

#### GET /api/sales-orders
**Purpose**: List all sales orders

**Auth**: Required

**Query Params**:
- `status` (optional): draft, confirmed, processing, ready_for_dispatch, part_dispatched, dispatched, completed, cancelled
- `companyId` (optional): UUID

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "SO/STC/2025/0001",
      "order_date": "2025-01-20",
      "customer_po_number": "PO/TATA/2025/123",
      "customer_po_date": "2025-01-18",
      "status": "confirmed",
      "customer": {
        "id": "uuid",
        "name": "Tata Steel Ltd"
      },
      "buyer": {
        "id": "uuid",
        "name": "Rajesh Kumar"
      },
      "items": [
        {
          "id": "uuid",
          "description": "SS304 Pipe 2 inch SCH 40",
          "quantity": 100,
          "unit_price": 500.00,
          "total_amount": 50000.00,
          "status": "pending"
        }
      ],
      "total_amount": 53000.00,
      "created_at": "2025-01-20T09:00:00Z"
    }
  ]
}
```

#### POST /api/sales-orders
**Purpose**: Create sales order (from quotation or standalone)

**Auth**: Required

**Request**:
```json
{
  "quotation_id": "uuid",
  "customer_id": "uuid",
  "buyer_id": "uuid",
  "customer_po_number": "PO/TATA/2025/123",
  "customer_po_date": "2025-01-18",
  "order_date": "2025-01-20",
  "payment_terms": "30 days from invoice date",
  "delivery_terms": "Ex-works Mumbai",
  "billing_address": {
    "line1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "shipping_address": {
    "line1": "456 Factory Rd",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001"
  },
  "items": [
    {
      "quotation_item_id": "uuid",
      "product_id": "uuid",
      "description": "SS304 Pipe 2 inch SCH 40",
      "quantity": 100,
      "unit_price": 500.00,
      "total_amount": 50000.00,
      "uom": "NOS",
      "hsn_code": "7304",
      "metadata": {
        "size": "2 inch",
        "schedule": "SCH 40",
        "grade": "SS304"
      }
    }
  ],
  "currency": "INR",
  "remarks": "Urgent delivery required"
}
```

**Validation**:
- `customer_po_number`: Required, min 1 char
- `billing_address`: Required JSONB
- `shipping_address`: Required JSONB
- `items`: Array, min 1 item

**Business Logic**:
1. Generate SO number
2. If `quotation_id` provided, copy items from quotation
3. Insert sales_orders row
4. Insert sales_order_items rows
5. Update quotation status to 'accepted' if linked
6. Update enquiry status to 'closed' if linked
7. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "order_number": "SO/STC/2025/0001",
    "status": "draft",
    "total_amount": 53000.00,
    "created_at": "2025-01-20T09:00:00Z"
  }
}
```

---

## Purchase Module APIs

### 4. Purchase Orders

#### GET /api/purchase-orders
**Purpose**: List all purchase orders

**Auth**: Required

**Query Params**:
- `status` (optional): draft, approved, sent, partial_received, received, closed, cancelled
- `vendor_id` (optional): UUID

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "po_number": "PO/STC/2025/0001",
      "po_date": "2025-01-22",
      "vendor": {
        "id": "uuid",
        "name": "JSW Steel"
      },
      "sales_order": {
        "id": "uuid",
        "order_number": "SO/STC/2025/0001"
      },
      "delivery_date": "2025-02-15",
      "status": "sent",
      "total_amount": 45000.00,
      "items": [
        {
          "product_id": "uuid",
          "quantity": 100,
          "unit_price": 450.00,
          "heat_number": "HT123456",
          "received_quantity": 0
        }
      ],
      "created_at": "2025-01-22T10:00:00Z"
    }
  ]
}
```

#### POST /api/purchase-orders
**Purpose**: Create purchase order

**Auth**: Required

**Request**:
```json
{
  "vendor_id": "uuid",
  "sales_order_id": "uuid",
  "delivery_date": "2025-02-15",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 100,
      "unit_price": 450.00,
      "heat_number": "HT123456",
      "so_item_id": "uuid"
    }
  ],
  "remarks": "Urgent PO"
}
```

**Validation**:
- `vendor_id`: Required UUID
- `delivery_date`: Required date string
- `items`: Array, min 1 item
- `items[].quantity`: Required positive number
- `items[].unit_price`: Required >= 0

**Business Logic**:
1. Generate PO number
2. Calculate total_amount
3. Insert purchase_orders row
4. Insert purchase_order_items rows
5. Link to SO items if provided
6. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "po_number": "PO/STC/2025/0001",
    "status": "draft",
    "total_amount": 45000.00,
    "created_at": "2025-01-22T10:00:00Z"
  }
}
```

---

### 5. GRNs (Goods Receipt Notes)

#### POST /api/grn
**Purpose**: Create GRN for received inventory

**Auth**: Required

**Request**:
```json
{
  "purchase_order_id": "uuid",
  "warehouse_id": "uuid",
  "received_by": "John Doe",
  "mtc_file_url": "https://storage.supabase.co/mtc/doc123.pdf",
  "items": [
    {
      "purchase_order_item_id": "uuid",
      "product_id": "uuid",
      "received_quantity": 95,
      "heat_number": "HT123456"
    }
  ],
  "remarks": "5 pieces short"
}
```

**Validation** (ISO 7.5.3):
- `mtc_file_url`: Required URL (MTC document mandatory)
- `items[].heat_number`: Required, min 1 char
- `items[].received_quantity`: Required >= 0

**Business Logic**:
1. Generate GRN number
2. Insert grns row
3. Insert grn_items rows
4. Create inventory records (status: 'pending_inspection')
5. Update purchase_order_items.received_quantity
6. Update PO status to 'partial_received' or 'received'
7. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "grn_number": "GRN/STC/2025/0001",
    "status": "pending_inspection",
    "created_at": "2025-02-16T08:00:00Z"
  }
}
```

**Error Cases**:
- 400: MTC document missing (ISO compliance violation)
- 400: Heat number missing
- 404: PO not found
- 500: Inventory creation failed

---

## Inventory Module APIs

### 6. Inventory

#### GET /api/inventory
**Purpose**: List inventory with FIFO ordering

**Auth**: Required

**Query Params**:
- `product_id` (optional): UUID
- `warehouse_id` (optional): UUID
- `status` (optional): available, allocated, dispatched, rejected

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "SS304 Pipe",
        "code": "P001"
      },
      "warehouse": {
        "id": "uuid",
        "name": "Mumbai Warehouse"
      },
      "heat_number": "HT123456",
      "quantity": 95,
      "allocated_quantity": 0,
      "status": "available",
      "mtc_reference": "MTC/2025/001",
      "grn": {
        "id": "uuid",
        "grn_number": "GRN/STC/2025/0001",
        "grn_date": "2025-02-16"
      },
      "created_at": "2025-02-16T08:30:00Z"
    }
  ]
}
```

**FIFO Logic**:
- Results ordered by `grn.grn_date ASC` (oldest first)
- Used during dispatch allocation

---

### 7. Dispatches

#### POST /api/dispatch
**Purpose**: Create dispatch from sales order

**Auth**: Required

**Request**:
```json
{
  "sales_order_id": "uuid",
  "vehicle_number": "MH-01-AB-1234",
  "driver_name": "Ramesh Kumar",
  "driver_phone": "+91-9876543210",
  "lr_number": "LR123456",
  "eway_bill_number": "EWB123456789012",
  "items": [
    {
      "sales_order_item_id": "uuid",
      "product_id": "uuid",
      "inventory_id": "uuid",
      "quantity": 50,
      "heat_number": "HT123456"
    }
  ],
  "remarks": "Partial dispatch"
}
```

**Validation**:
- `sales_order_id`: Required UUID
- `items`: Array, min 1 item
- `items[].inventory_id`: Required UUID (specific batch)
- `items[].heat_number`: Required (traceability)

**Business Logic** (FIFO Allocation):
1. Generate dispatch number
2. For each item:
   - Query inventory WHERE product_id AND status='available' ORDER BY grn_date ASC
   - Allocate quantity from oldest batches first
   - Update inventory.allocated_quantity
   - Create dispatch_items records
3. Update SO item status to 'dispatched'
4. Update SO status to 'part_dispatched' or 'dispatched'
5. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "dispatch_number": "DSP/STC/2025/0001",
    "status": "pending",
    "created_at": "2025-02-20T10:00:00Z"
  }
}
```

**Error Cases**:
- 400: Insufficient inventory for FIFO allocation
- 400: Heat number mismatch
- 404: Sales order not found

---

## Finance Module APIs

### 8. Invoices

#### POST /api/invoices
**Purpose**: Create invoice from dispatch

**Auth**: Required

**Request**:
```json
{
  "dispatch_id": "uuid",
  "due_date": "2025-03-22",
  "remarks": "Payment within 30 days"
}
```

**Validation**:
- `dispatch_id`: Required UUID
- `due_date`: Required date string

**Business Logic** (GST Calculation):
1. Generate invoice number
2. Fetch dispatch details (SO, customer, items)
3. Calculate subtotal from dispatch items
4. Determine GST type:
   - If warehouse.state == customer.state → CGST + SGST (9% + 9%)
   - If warehouse.state != customer.state → IGST (18%)
5. Calculate totals:
   - `cgst = subtotal * 0.09` (intra-state)
   - `sgst = subtotal * 0.09` (intra-state)
   - `igst = subtotal * 0.18` (inter-state)
   - `total_amount = subtotal + cgst + sgst + igst`
6. Insert invoice header
7. Insert invoice_items
8. Update dispatch status to 'invoiced'
9. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "invoice_number": "INV/STC/2025/0001",
    "invoice_date": "2025-02-20",
    "due_date": "2025-03-22",
    "subtotal": 50000.00,
    "cgst": 4500.00,
    "sgst": 4500.00,
    "igst": 0.00,
    "total_amount": 59000.00,
    "status": "draft",
    "created_at": "2025-02-20T11:00:00Z"
  }
}
```

**Known Issues**:
- GST rates hardcoded (should be configurable)
- No support for multiple GST rates per invoice
- Place of supply not validated

---

### 9. Payment Receipts

#### POST /api/payments
**Purpose**: Record customer payment with invoice allocation

**Auth**: Required

**Request**:
```json
{
  "customer_id": "uuid",
  "amount": 59000.00,
  "payment_mode": "neft",
  "reference_number": "NEFT123456789",
  "receipt_date": "2025-02-25",
  "bank_details": "HDFC Bank, A/c: 12345678",
  "allocations": [
    {
      "invoice_id": "uuid",
      "amount": 59000.00
    }
  ],
  "remarks": "Full payment received"
}
```

**Validation**:
- `customer_id`: Required UUID
- `amount`: Required positive number
- `payment_mode`: Required enum (cash, cheque, neft, rtgs, upi, wire)
- `allocations`: Array, min 1 allocation
- `allocations[].amount`: Sum must equal payment amount

**Business Logic**:
1. Generate receipt number
2. Insert payment_receipts row
3. Insert payment_receipt_items rows (allocations)
4. For each invoice:
   - Update invoices.paid_amount += allocation.amount
   - Update invoice status:
     - If paid_amount == total_amount → 'paid'
     - If paid_amount > 0 AND < total_amount → 'partial_paid'
5. Log audit event

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "receipt_number": "RCP/STC/2025/0001",
    "amount": 59000.00,
    "created_at": "2025-02-25T09:00:00Z"
  }
}
```

**Error Cases**:
- 400: Allocation sum mismatch
- 400: Over-allocation (allocated > invoice outstanding)
- 404: Invoice not found

---

## Master Data APIs

### 10. Customers

#### GET /api/customers
**Purpose**: List all customers

**Auth**: Required

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tata Steel Ltd",
      "customer_code": "CUST001",
      "gstin": "27AAAAA0000A1Z5",
      "email": "contact@tata.com",
      "billing_city": "Mumbai",
      "billing_state": "Maharashtra",
      "payment_terms": "30 days",
      "credit_limit": 1000000.00,
      "opening_balance": 50000.00,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/customers
**Purpose**: Create new customer

**Auth**: Required

**Request**:
```json
{
  "name": "Tata Steel Ltd",
  "customer_type": "Domestic",
  "gstin": "27AAAAA0000A1Z5",
  "pan": "AAAAA0000A",
  "email": "contact@tata.com",
  "telephone": "022-12345678",
  "mobile": "+91-9876543210",
  "billing_address_line1": "123 Main St",
  "billing_city": "Mumbai",
  "billing_state": "Maharashtra",
  "billing_pincode": "400001",
  "shipping_address_line1": "456 Factory Rd",
  "shipping_city": "Pune",
  "shipping_state": "Maharashtra",
  "shipping_pincode": "411001",
  "payment_terms": "30 days from invoice date",
  "credit_limit": 1000000.00,
  "opening_balance": 50000.00
}
```

**Validation**:
- `name`: Required, min 1 char
- `gstin`: Optional, 15 chars (format: 99AAAAA9999A9Z9)
- `pan`: Optional, 10 chars (format: AAAAA9999A)
- `email`: Optional, valid email format

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Tata Steel Ltd",
    "customer_code": "CUST001",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 11. Buyers

#### GET /api/buyers
**Purpose**: List buyers for a customer

**Auth**: Required

**Query Params**:
- `customer_id` (required): UUID

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "name": "Rajesh Kumar",
      "designation": "Purchase Manager",
      "email": "rajesh@tata.com",
      "mobile": "+91-9876543210",
      "is_primary_contact": true,
      "total_orders": 15,
      "total_value": 2500000.00,
      "last_order_date": "2025-02-20",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Performance Note**: `total_orders` and `total_value` are denormalized and updated via trigger on sales_orders table (SLOW).

---

### 12. Products

#### GET /api/products
**Purpose**: List all products

**Auth**: Required

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "SS304 Pipe",
      "product_code": "P001",
      "category": "Pipes",
      "hsn_code": "7304",
      "uom": "NOS",
      "description": "Stainless Steel 304 Seamless Pipe",
      "specifications": {
        "material": "SS304",
        "type": "Seamless"
      },
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## Admin APIs

### 13. Audit Logs

#### GET /api/admin/audit-logs
**Purpose**: Fetch audit trail (ISO 9001:2018)

**Auth**: Required

**Query Params**:
- `table_name` (optional): Filter by table
- `record_id` (optional): Filter by record
- `action` (optional): CREATE, UPDATE, DELETE, STATUS_CHANGE
- `limit` (optional): Default 100

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "table_name": "sales_orders",
      "record_id": "uuid",
      "action": "STATUS_CHANGE",
      "old_data": {
        "status": "draft"
      },
      "new_data": {
        "status": "confirmed"
      },
      "created_at": "2025-02-20T10:00:00Z"
    }
  ]
}
```

**Performance**: Index on (table_name, record_id) ensures fast lookups.

---

### 14. Dashboard KPIs

#### GET /api/dashboard
**Purpose**: Fetch dashboard metrics

**Auth**: Required

**Response**:
```json
{
  "data": {
    "sales": {
      "total_orders": 150,
      "total_value": 7500000.00,
      "pending_orders": 25,
      "pending_value": 1250000.00
    },
    "purchase": {
      "total_pos": 120,
      "total_value": 5400000.00,
      "pending_grns": 10
    },
    "inventory": {
      "total_stock_value": 3200000.00,
      "available_quantity": 5000,
      "allocated_quantity": 1200
    },
    "finance": {
      "total_receivables": 2100000.00,
      "overdue_amount": 350000.00,
      "total_payables": 1800000.00
    }
  }
}
```

**Performance Issue**: This endpoint runs 10+ aggregate queries sequentially (2-3s load time). Should be cached.

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data fetched/created successfully |
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | User lacks permission (RLS violation) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (e.g., unique constraint) |
| 500 | Server Error | Database error, unexpected exception |

### Common Error Messages

**Validation Errors**:
```json
{
  "error": "At least one item is required"
}
```

**Authentication Errors**:
```json
{
  "error": "Unauthorized"
}
```

**Database Errors**:
```json
{
  "error": "duplicate key value violates unique constraint \"uq_sales_order_number_company\""
}
```

**Not Found Errors**:
```json
{
  "error": "Customer not found"
}
```

---

## API Testing

### Example cURL Commands

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Create Quotation**:
```bash
curl -X POST http://localhost:3000/api/quotations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer_id":"uuid",
    "quotation_type":"STANDARD",
    "items":[{"product_id":"uuid","quantity":100,"unit_price":500}]
  }'
```

**Fetch Sales Orders**:
```bash
curl http://localhost:3000/api/sales-orders?status=confirmed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Known API Issues

1. **No Pagination**: All list endpoints return full datasets (can be 1000+ records)
2. **No Rate Limiting**: APIs can be spammed
3. **Inconsistent Error Responses**: Some return 500 for validation errors
4. **No API Versioning**: Breaking changes will affect all clients
5. **Slow Dashboard Endpoint**: 2-3s load time due to sequential aggregations
6. **Missing PATCH Endpoints**: Most updates require full PUT (should support partial updates)
7. **No Bulk Operations**: Creating 100 products requires 100 API calls
8. **Weak Input Sanitization**: JSONB fields accept arbitrary data

---

**End of API Documentation**
