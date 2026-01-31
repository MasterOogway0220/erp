
# Quotation Module – Complete Implementation Guide

**Module:** Sales → Quotations
**Objective:** Fully functional, production-ready quotation system (Domestic + Export)
**Reference Inputs:**

* Pipes Quotation Format (Excel)
* Export Quotation Format (Excel)

---

## 1. Quotation Types

The system **must explicitly support two quotation types**.

### 1.1 Domestic Quotation

* Currency: INR
* GST Applicable
* CGST + SGST or IGST
* Local delivery terms

### 1.2 Export Quotation

* Currency: USD / EUR / AED (extendable)
* No GST
* Incoterms-based pricing
* Port and country-level export data

### Required Fields

```ts
quotation_type: 'domestic' | 'export'
currency_code: 'INR' | 'USD' | 'EUR'
exchange_rate?: number // mandatory if currency != INR
```

---

## 2. Quotation Header (Master Section)

### Common Mandatory Fields

| Field            | Required | Notes                 |
| ---------------- | -------- | --------------------- |
| Quotation Number | Auto     | Year-based sequence   |
| Quotation Date   | Yes      | Default: today        |
| Customer         | Yes      | From customer master  |
| Customer Address | Yes      | Auto-filled           |
| Contact Person   | Yes      |                       |
| Email            | Yes      |                       |
| Phone            | Optional |                       |
| Validity Date    | Yes      | Used for expiry logic |
| Sales Executive  | Auto     | Logged-in user        |
| Status           | Auto     | Workflow driven       |

---

### Domestic-Specific Fields

| Field           | Notes                |
| --------------- | -------------------- |
| GST Number      | From customer        |
| Place of Supply | Determines IGST/CGST |
| Tax Type        | Auto-calculated      |

---

### Export-Specific Fields

| Field                  | Notes                  |
| ---------------------- | ---------------------- |
| Incoterms              | FOB / CIF / CFR / EXW  |
| Port of Loading        |                        |
| Port of Destination    |                        |
| Country of Destination |                        |
| Payment Terms          | Advance / LC / DA / DP |
| Delivery Period        | Text (e.g. 6–8 weeks)  |

---

## 3. Quotation Line Items (Critical Section)

Each quotation supports **multiple editable line items**.

### Line Item Fields

| Field           | Required      | Notes                   |
| --------------- | ------------- | ----------------------- |
| Product         | Yes           | From product master     |
| Description     | Yes           | Editable (specs, grade) |
| Size            | Optional      | e.g. 4”, 6”             |
| Grade           | Optional      | ASTM / API              |
| Quantity        | Yes           | Numeric                 |
| Unit            | Yes           | Nos / Meters / Tons     |
| Rate            | Yes           | Per unit                |
| Discount %      | Optional      |                         |
| Discount Amount | Auto          |                         |
| Tax %           | Domestic only |                         |
| Line Total      | Auto          |                         |

---

### Calculation Logic

#### Domestic

```text
Gross = Quantity × Rate
Discount = Gross × Discount %
Taxable = Gross - Discount
GST = Taxable × GST %
Line Total = Taxable + GST
```

#### Export

```text
Line Total = Quantity × Rate
(No tax)
```

---

## 4. Charges Section (Excel Matching)

Charges must be **configurable, optional, and toggle-based**.

### Supported Charges

| Charge                | Domestic | Export |
| --------------------- | -------- | ------ |
| Packing Charges       | ✅        | ✅      |
| Freight Charges       | ✅        | ✅      |
| Insurance             | ❌        | ✅      |
| Documentation Charges | ❌        | ✅      |
| Loading Charges       | ✅        | ✅      |

### Data Structure

```ts
quotation_charges: {
  packing?: number
  freight?: number
  insurance?: number
  documentation?: number
  loading?: number
}
```

---

## 5. Quotation Summary

### Domestic Summary

| Field       | Formula                |
| ----------- | ---------------------- |
| Subtotal    | Sum of taxable amounts |
| CGST        | 9%                     |
| SGST        | 9%                     |
| OR IGST     | 18%                    |
| Grand Total | Final amount           |

---

### Export Summary

| Field       | Formula                   |
| ----------- | ------------------------- |
| FOB Value   | Sum of line totals        |
| Freight     | Optional                  |
| Insurance   | Optional                  |
| CIF Value   | FOB + Freight + Insurance |
| Grand Total | Final                     |

---

## 6. Terms & Conditions

* Editable per quotation
* Default templates stored in DB
* Supports Domestic & Export versions

### Mandatory Clauses

* Price validity
* Delivery schedule
* Payment terms
* Inspection clause
* Force majeure
* Jurisdiction

---

## 7. Approval Workflow (Mandatory)

### Approval Triggers

| Condition            | Approval Required |
| -------------------- | ----------------- |
| Discount > threshold | Yes               |
| Export quotation     | Always            |
| Value > limit        | Yes               |

### Status Flow

```text
Draft → Pending Approval → Approved → Sent → Accepted / Rejected / Expired
```

❗ **Hard Rule**
Sales Order **cannot be created** unless quotation is **Approved or Accepted**.

---

## 8. PDF Generation (Client-Facing)

### Must Match Excel Formats

PDF Requirements:

* Company letterhead
* Logo
* Currency formatting
* GST breakup (domestic)
* Bank details footer
* Page numbers

### Recommended Tech

* `puppeteer` (best for pixel-perfect PDFs)
* `react-pdf` (acceptable alternative)

---

## 9. Versioning & Audit

### Revision Handling

* QTN-001 → Rev A → Rev B
* Older revisions locked
* Only latest active

### Audit Logs

* Price changes
* Discount changes
* Approval actions
* Status transitions

---

## 10. Database Tables (Quotation Scope)

* quotations
* quotation_items
* quotation_charges
* quotation_terms
* quotation_revisions

---

## 11. API Endpoints (No Dummy Data)

```http
POST   /api/quotations
GET    /api/quotations
GET    /api/quotations/:id
PATCH  /api/quotations/:id
POST   /api/quotations/:id/submit
POST   /api/quotations/:id/approve
POST   /api/quotations/:id/pdf
```

### API Rules

* Zod validation
* Role-based access
* Audit logging mandatory

---

## 12. UX Expectations (Client Will Judge)

* Excel-like line item editing
* Live calculations
* Clear approval indicators
* Print-ready PDF
* Locked fields post-approval

---

## 13. Definition of DONE (Quotation Module)

The module is **production-ready** only when:

* [ ] Domestic & Export supported
* [ ] Excel-calculation parity
* [ ] Approval enforced
* [ ] PDF matches client format
* [ ] Zero dummy data
* [ ] SO creation properly restricted

---
