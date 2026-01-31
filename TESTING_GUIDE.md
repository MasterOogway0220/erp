# Testing Guide: Quotation Module End-to-End

This guide walks you through testing the complete quotation workflow with sample data.

## Prerequisites

1. ✅ Dev server running (`npm run dev`)
2. ✅ Logged into the ERP system
3. ✅ Database is accessible

## Step 1: Seed Sample Data

### Option A: Using SQL Script (Recommended)

1. Open your database client (e.g., Supabase Dashboard, pgAdmin, or psql)
2. Run the script: `scripts/seed-sample-data.sql`
3. Verify success message appears

### Option B: Manual Entry via UI

If you prefer, you can manually create:
- 2 companies via `/masters/companies`
- 5 customers via `/masters/customers`
- 10 products via `/masters/products`
- Terms & Conditions via `/masters/terms`

## Step 2: Import Pipe Sizes & Product Specs

1. Navigate to http://localhost:3000/masters/import
2. Select **"Pipe Sizes"**
3. Upload `documents/csv/pipe_sizes_cs_as.csv`
4. Review preview → Click **"Confirm Import"**
5. Upload `documents/csv/pipe_sizes_ss_ds.csv`
6. Review preview → Click **"Confirm Import"**
7. Select **"Product Specifications"**
8. Upload `documents/csv/product_specs.csv`
9. Review preview → Click **"Confirm Import"**

**Verify:** Go to `/masters/pipe-sizes` and `/masters/product-specs` to confirm data

## Step 3: Test Standard Quotation Flow

### 3.1 Create Standard Quotation

1. Go to http://localhost:3000/sales/quotations/new
2. Fill in:
   - **Customer:** Select "Reliance Industries Ltd"
   - **Buyer:** Select "Rajesh Kumar"
   - **Quotation Type:** STANDARD
   - **Currency:** INR
   - **Valid Until:** 30 days from today

3. Add Line Items:
   - **Product:** CS Seamless Pipe 2" SCH 40
   - **Quantity:** 100
   - **Unit Price:** 5200
   - **UOM:** MTR
   
4. Verify:
   - ✅ Material code auto-populated
   - ✅ T&C auto-populated from customer defaults
   - ✅ Subtotal calculated correctly
   - ✅ Tax (18% GST) calculated
   - ✅ Total amount shown

5. Click **"Create Quotation"**

### 3.2 View Quotation

1. Navigate to the quotation detail page
2. Verify all fields display correctly
3. Check version shows "Rev. 1"

### 3.3 Print Quotation (With Price)

1. Click **Print** button
2. Select **"Print with Price"**
3. Verify:
   - ✅ Company letterhead appears
   - ✅ Customer details shown
   - ✅ Line items with prices
   - ✅ Subtotal, tax, total displayed
   - ✅ T&C section populated
   - ✅ Signature block present

### 3.4 Print Quotation (Without Price)

1. Click **Print** button
2. Select **"Print without Price (QUOTED)"**
3. Verify:
   - ✅ All prices show "QUOTED" instead of amounts
   - ✅ Total shows "AS QUOTED"
   - ✅ All other details remain visible

## Step 4: Test Quotation Revision

### 4.1 Create Revision

1. From quotation detail page, click **"Create Revision"**
2. System creates new quotation with:
   - Same quotation number
   - Version incremented to "Rev. 2"
   - All data copied from parent

3. Modify something (e.g., change quantity or add item)
4. Save the revision

### 4.2 Verify Version Chain

1. Go back to original quotation (Rev. 1)
2. Verify:
   - ✅ Shows "Superseded by Rev. 2" warning
   - ✅ `is_latest_version` = false
   - ✅ Link to latest version visible

3. View version history
4. Verify both versions listed

## Step 5: Test Non-Standard Quotation

1. Go to `/sales/quotations/new`
2. Select **Quotation Type:** NON_STANDARD
3. Add items with free-text descriptions
4. Verify different UI/format
5. Create and print

## Step 6: Test Approval Workflow

### 6.1 Submit for Approval

1. Open a draft quotation
2. Click **"Submit for Approval"**
3. Verify status changes to "pending_approval"

### 6.2 Approve Quotation

1. As an approver, view the quotation
2. Click **"Approve"**
3. Add approval remarks
4. Verify status changes to "approved"

### 6.3 Test Rejection

1. Create another quotation
2. Submit for approval
3. Click **"Reject"**
4. Add rejection reason
5. Verify status changes to "rejected"

## Step 7: Test Quotation to Sales Order Conversion

1. Open an approved quotation
2. Click **"Convert to Sales Order"**
3. Enter customer PO number
4. Verify:
   - ✅ Credit limit checked
   - ✅ All line items transferred
   - ✅ Sales order created
   - ✅ Link back to quotation exists

## Step 8: Test Search & Filters

1. Go to `/sales/quotations`
2. Test filters:
   - By status (draft, pending, approved)
   - By customer
   - By date range
3. Test search by quotation number
4. Verify results are accurate

## Step 9: Verify Calculations

Create a quotation with:
- Item 1: Qty 100 × ₹5,200 = ₹5,20,000
- Item 2: Qty 50 × ₹8,500 = ₹4,25,000
- **Subtotal:** ₹9,45,000
- **Tax (18%):** ₹1,70,100
- **Packing Charges:** ₹5,000
- **Freight Charges:** ₹10,000
- **Total:** ₹10,30,100

Verify all calculations are correct.

## Step 10: Test Edge Cases

### 10.1 Customer with No Default T&C
1. Create customer without default T&C
2. Create quotation
3. Verify T&C section is empty (can be manually selected)

### 10.2 Product Without Material Code
1. Create product without internal code
2. Verify auto-generation on save

### 10.3 Multiple Revisions
1. Create quotation (Rev. 1)
2. Create revision (Rev. 2)
3. Create another revision (Rev. 3)
4. Verify version chain: Rev. 1 → Rev. 2 → Rev. 3

## Success Criteria

✅ All quotations create successfully
✅ Print templates render correctly (with/without price)
✅ Versioning works properly
✅ Approval workflow functions
✅ Calculations are accurate
✅ T&C auto-population works
✅ Material codes auto-generate
✅ Sales order conversion works
✅ Search and filters work

## Troubleshooting

**Issue:** "Customer not found" error
- **Solution:** Ensure sample customers are seeded

**Issue:** Print page shows no company details
- **Solution:** Seed company data via SQL script

**Issue:** T&C don't auto-populate
- **Solution:** Set default_terms_id for customer

**Issue:** Material code not auto-generating
- **Solution:** Check product category and grade fields are filled

## Next Steps

After successful testing:
1. Document any bugs found
2. Note any UX improvements needed
3. Prepare for production data migration
4. Train users on the workflows
