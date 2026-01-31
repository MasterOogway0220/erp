# Manual Testing Guide - Phases 1, 2, 3

## 🚀 Quick Start

Your development server is already running at: **http://localhost:3000**

Follow this guide to test all implemented features systematically.

---

## Phase 1: Quotation Module Testing

### Test 1.1: Quotation Creation
1. Navigate to **http://localhost:3000/sales/quotations**
2. Click **"New Quotation"** button
3. **Verify:**
   - ✅ Customer dropdown is populated
   - ✅ Buyer dropdown appears after selecting customer
   - ✅ Format selection (Standard/Non-Standard) is visible
   - ✅ Terms & Conditions checkboxes are displayed
   - ✅ Product selection works
   - ✅ Add Item button adds new rows

### Test 1.2: Quotation Versioning
1. Create a quotation and save it
2. Note the quotation number (e.g., `QTN/STC/2026/0001`)
3. Open the quotation
4. Click **"Create Revision"** button
5. **Verify:**
   - ✅ New quotation created with Rev.02
   - ✅ Original marked as "Superseded"
   - ✅ Parent-child relationship visible
   - ✅ Version history displayed

### Test 1.3: Print Templates
1. Open any quotation
2. Click **"Print"** button
3. **Verify:**
   - ✅ Print preview opens in new tab
   - ✅ Company letterhead displays
   - ✅ Customer details shown
   - ✅ Line items with pricing visible
   - ✅ Terms & Conditions section present
   - ✅ Signature blocks at bottom

4. Add `?price=false` to the URL
5. **Verify:**
   - ✅ Prices replaced with "QUOTED" text
   - ✅ All other details remain visible

### Test 1.4: Terms & Conditions
1. Go to **http://localhost:3000/masters/terms**
2. **Verify:**
   - ✅ List of T&C displayed
   - ✅ Add new T&C button works
   - ✅ Edit T&C functionality works

3. Create a new quotation
4. **Verify:**
   - ✅ T&C checkboxes auto-populate from customer defaults
   - ✅ Can select/deselect T&C
   - ✅ Can add custom T&C
   - ✅ Can reorder T&C (drag-and-drop)

---

## Phase 2: Master Data Testing

### Test 2.1: Pipe Sizes Master
1. Navigate to **http://localhost:3000/masters/pipe-sizes**
2. **Verify:**
   - ✅ Table displays columns: Size, OD, Schedule, Wall Thickness, Weight
   - ✅ Material type filter works (CS, SS, AS, DS)
   - ✅ Search functionality works
   - ✅ Pagination works (if data present)
   - ✅ Add new pipe size button works

### Test 2.2: Product Specifications Master
1. Navigate to **http://localhost:3000/masters/product-specs**
2. **Verify:**
   - ✅ Table displays: Product, Material, Spec, Ends, Length
   - ✅ Filters work correctly
   - ✅ Add new spec button works
   - ✅ Edit functionality works

### Test 2.3: Master Data Import
1. Navigate to **http://localhost:3000/masters/import**
2. **Verify:**
   - ✅ File upload area is visible
   - ✅ Master type selection dropdown works
   - ✅ Supports .xlsx and .xls files
   - ✅ Preview displays after file selection
   - ✅ Confirm Import button works

3. Try importing a sample Excel file
4. **Verify:**
   - ✅ Success message appears
   - ✅ Data appears in respective master page

### Test 2.4: Material Code Auto-Generation
1. Navigate to **http://localhost:3000/masters/products**
2. Click **"Add Product"**
3. Fill in product details
4. **Verify:**
   - ✅ Internal material code auto-generates (format: CATEGORY-MATERIAL-NNNN)
   - ✅ Customer material code field is optional
   - ✅ Both codes saved correctly

### Test 2.5: Customer Enhancements
1. Navigate to **http://localhost:3000/masters/customers**
2. Click **"Add Customer"** or edit existing
3. **Verify:**
   - ✅ Default T&C selection dropdown
   - ✅ Multiple dispatch addresses section
   - ✅ Credit limit field
   - ✅ Customer material code mapping section

4. Add a buyer for the customer
5. Navigate to **http://localhost:3000/masters/buyers**
6. **Verify:**
   - ✅ Buyer linked to customer
   - ✅ Contact details (name, designation, email) saved

---

## Phase 3: ISO Compliance Testing

### Test 3.1: Buyer Linkage in Enquiries (ISO 8.2.1)
1. Navigate to **http://localhost:3000/sales/enquiries**
2. Click **"New Enquiry"**
3. Select a customer
4. **Verify:**
   - ✅ Buyer dropdown appears
   - ✅ Buyers filtered by selected customer
   - ✅ Buyer selection is optional
   - ✅ Enquiry saves with buyer_id

5. View enquiry list
6. **Verify:**
   - ✅ Buyer name displayed in enquiry list
   - ✅ Buyer details visible in enquiry details

### Test 3.2: Vendor Evaluation System (ISO 8.4.1)
1. Navigate to **http://localhost:3000/vendors**
2. Click on a vendor (or create one first)
3. Click **"Evaluate Vendor"** button
4. **Verify:**
   - ✅ Evaluation form loads
   - ✅ 4 star rating sections visible:
     - Quality Score
     - Delivery Score
     - Pricing Score
     - Communication Score
   - ✅ Overall score auto-calculates
   - ✅ Remarks field present
   - ✅ Previous evaluations sidebar shows history

5. Rate the vendor (click stars)
6. Add remarks
7. Click **"Submit Evaluation"**
8. **Verify:**
   - ✅ Success message appears
   - ✅ Redirects to vendor page
   - ✅ Evaluation saved in history

### Test 3.3: Mandatory Approval Remarks (ISO 8.2.3)
1. Create a quotation
2. Submit for approval
3. Try to approve WITHOUT entering remarks
4. **Verify:**
   - ✅ Error message: "Approval remarks are mandatory for ISO 8.2.3 compliance"
   - ✅ Approval blocked

5. Enter remarks in the remarks field
6. Click approve again
7. **Verify:**
   - ✅ Approval succeeds
   - ✅ Remarks saved with quotation
   - ✅ Audit log updated

8. Try to reject WITHOUT remarks
9. **Verify:**
   - ✅ Error message: "Rejection remarks are mandatory for ISO 8.2.3 compliance"
   - ✅ Rejection blocked

### Test 3.4: MTC Mandatory Validation (ISO 7.5.3)
1. Navigate to **http://localhost:3000/procurement/grn**
2. Click **"Create GRN"**
3. Fill in GRN details
4. Try to submit WITHOUT uploading MTC
5. **Verify:**
   - ✅ Error message: "MTC document is mandatory for ISO 7.5.3 compliance"
   - ✅ GRN creation blocked

6. Upload MTC document
7. Submit GRN
8. **Verify:**
   - ✅ GRN created successfully
   - ✅ MTC linked to inventory

### Test 3.5: Inventory Dashboard (Point 11)
1. Navigate to **http://localhost:3000/inventory/dashboard**
2. **Verify Summary Cards:**
   - ✅ Total Inventory Value (₹ + count)
   - ✅ Under QC Inspection (count)
   - ✅ Accepted & Ready (count)
   - ✅ Rejected Items (count)

3. **Verify Filters:**
   - ✅ Form dropdown (CS, SS, AS, DS)
   - ✅ Type dropdown (SMLS, Welded)
   - ✅ Heat Number search
   - ✅ QC Status dropdown
   - ✅ Location search

4. **Verify Table:**
   - ✅ Color-coded rows:
     - Green border = QC Accepted
     - Yellow border = Under Inspection
     - Red border = Rejected
   - ✅ Columns: Form, Type, Spec, Dimension, Size, Ends, Length, Heat No., Make, Qty, Pieces, MTC, Location, QC Status, Notes

5. Test filters
6. **Verify:**
   - ✅ Table updates based on filter selection
   - ✅ Summary cards update
   - ✅ Heat number search works

### Test 3.6: Order Status Tracking (Point 12)
1. Navigate to **http://localhost:3000/sales/orders/tracking**
2. **Verify Search Interface:**
   - ✅ Search input field present
   - ✅ Search type dropdown with options:
     - SO Number
     - Customer PO
     - Product Code
     - Heat Number
   - ✅ Search button present

3. Enter a search query (if you have sample data)
4. Click **"Search"**
5. **Verify Results:**
   - ✅ Order cards display
   - ✅ Product name and SO number visible
   - ✅ Customer name displayed
   - ✅ Current status badge shown

6. **Verify Timeline:**
   - ✅ Progress bar shows percentage
   - ✅ Status flow displayed vertically:
     - SO Confirmed
     - PO Placed
     - Material Received
     - Under QC
     - QC Accepted
     - Ready to Dispatch
     - Dispatched
     - Invoiced
     - Paid
   - ✅ Completed steps in green
   - ✅ Current step in blue
   - ✅ Pending steps in gray
   - ✅ Icons for each status

7. **Verify Item Details:**
   - ✅ Quantity and UOM
   - ✅ Heat Number
   - ✅ PO Number (if linked)
   - ✅ GRN Number (if received)

### Test 3.7: Enhanced Document Numbering
1. Create a new quotation
2. **Verify:**
   - ✅ Quotation number format: `QTN/STC/2026/XXXX`
   - ✅ Company code included (STC)
   - ✅ Year included (2026)
   - ✅ Sequential number (0001, 0002, etc.)

3. Create a sales order
4. **Verify:**
   - ✅ SO number format: `SO/STC/2026/XXXX`

5. Create a purchase order
6. **Verify:**
   - ✅ PO number format: `PO/STC/2026/XXXX`

---

## Database Verification

### Run Migration
```bash
# Execute Phase 3 migration
psql $DATABASE_URL -f database_migrations/07_iso_compliance_phase3.sql
```

### Verify Tables
```sql
-- Check vendor_evaluations table
SELECT * FROM vendor_evaluations LIMIT 5;

-- Check item_status_history table
SELECT * FROM item_status_history LIMIT 5;

-- Check enquiries buyer_id column
SELECT id, enquiry_number, customer_id, buyer_id FROM enquiries LIMIT 5;

-- Check sales_order_items status column
SELECT id, status, linked_po_id, linked_grn_id FROM sales_order_items LIMIT 5;
```

---

## API Testing (Optional)

### Test Vendor Evaluations API
```bash
# GET vendor evaluations
curl http://localhost:3000/api/vendor-evaluations?vendor_id=<vendor-id>

# POST new evaluation
curl -X POST http://localhost:3000/api/vendor-evaluations \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "<vendor-id>",
    "quality_score": 5,
    "delivery_score": 4,
    "pricing_score": 4,
    "communication_score": 5,
    "remarks": "Excellent vendor"
  }'
```

### Test Item Status History API
```bash
# GET item status history
curl http://localhost:3000/api/item-status-history?so_item_id=<item-id>

# POST status update
curl -X POST http://localhost:3000/api/item-status-history \
  -H "Content-Type: application/json" \
  -d '{
    "so_item_id": "<item-id>",
    "status": "UNDER_QC",
    "notes": "Material received and sent for QC"
  }'
```

### Test Sales Order Items API
```bash
# Search by SO number
curl http://localhost:3000/api/sales-order-items?so=SO-2026-0001

# Search by heat number
curl http://localhost:3000/api/sales-order-items?heat=HT123456
```

---

## Expected Results Summary

### ✅ Phase 1 (Quotation Module)
- Quotation versioning works
- Print templates display correctly
- T&C management functional
- Dual formats supported

### ✅ Phase 2 (Master Data)
- All master pages load
- Import functionality works
- Material codes auto-generate
- Customer enhancements present

### ✅ Phase 3 (ISO Compliance)
- Buyer linkage in enquiries
- Vendor evaluation system
- Mandatory remarks enforced
- MTC validation enforced
- Inventory dashboard functional
- Order tracking with timeline
- Enhanced document numbering

---

## Troubleshooting

### If pages don't load:
1. Check browser console for errors (F12)
2. Verify database connection
3. Check if migrations ran successfully
4. Ensure all environment variables are set

### If data doesn't display:
1. Import sample data first
2. Check database has records
3. Verify API routes are working
4. Check network tab for failed requests

### If features don't work:
1. Clear browser cache
2. Restart development server
3. Check for TypeScript errors
4. Review server logs

---

## Next Steps After Testing

1. **Fix any issues found**
2. **Import production master data**
3. **Configure company details**
4. **Set up user accounts**
5. **Train users**
6. **Deploy to production**

---

## Support

If you encounter any issues during testing:
1. Check browser console for errors
2. Review server logs
3. Verify database schema
4. Check API responses in Network tab

**All features are implemented and ready for testing!** 🚀
