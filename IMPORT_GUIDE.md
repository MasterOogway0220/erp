# Master Data Import Guide

Follow these steps to import all master data into the ERP system.

## Prerequisites

✅ Dev server is running (`npm run dev`)
✅ CSV files have been generated in `documents/csv/`
✅ You are logged into the ERP system

## Import Steps

### 1. Import Pipe Sizes (CS & AS)

1. Navigate to http://localhost:3000/masters/import
2. Click on **"Pipe Sizes"** button
3. Click **"Download Template"** to see the expected format (optional)
4. Drag and drop or click to upload: `documents/csv/pipe_sizes_cs_as.csv`
5. Review the preview (should show ~191 records)
6. Click **"Confirm Import"**
7. Wait for success message

### 2. Import Pipe Sizes (SS & DS)

1. Stay on the import page
2. Make sure **"Pipe Sizes"** is still selected
3. Upload: `documents/csv/pipe_sizes_ss_ds.csv`
4. Review the preview (should show ~80 records)
5. Click **"Confirm Import"**
6. Wait for success message

**Verify:** Go to http://localhost:3000/masters/pipe-sizes and confirm you see 271 total records

### 3. Import Product Specifications

1. On the import page, click **"Product Specifications"** button
2. Upload: `documents/csv/product_specs.csv`
3. Review the preview
4. Click **"Confirm Import"**
5. Wait for success message

**Verify:** Go to http://localhost:3000/masters/product-specs and confirm records are visible

### 4. Import Products (if you have product data)

1. On the import page, click **"Products"** button
2. Upload your products CSV file
3. Review the preview
4. Click **"Confirm Import"**

**Verify:** Go to http://localhost:3000/masters/products

### 5. Import Customers (if you have customer data)

1. On the import page, click **"Customers"** button
2. Upload your customers CSV file
3. Review the preview
4. Click **"Confirm Import"**

**Verify:** Go to http://localhost:3000/masters/customers

## Inventory Master

The inventory master data is in `documents/csv/inventory.csv`. This may require:
- Creating an inventory import endpoint
- Or manually entering inventory records through the UI

## Company, Employee, Buyer Data

If you have Excel files for these, I can help convert them to CSV and add import options for them.

## Troubleshooting

**Issue:** "Unauthorized" error
- **Solution:** Make sure you're logged into the ERP system

**Issue:** Import fails with validation error
- **Solution:** Check the CSV column names match the template exactly

**Issue:** Duplicate records
- **Solution:** The system may reject duplicates. Check the error message for details.

## Next Steps After Import

1. Verify all data in their respective master pages
2. Check that relationships are correct (e.g., products linked to UOMs)
3. Test creating a quotation with the imported data
