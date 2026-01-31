# Quick Fixes for Runtime Errors

## Issues Found
1. **Outstanding Page** - Invoice data undefined/null errors
2. **Purchase Orders Page** - Vendor/Product data undefined errors  
3. **Buyer Data** - No buyers in database

## Immediate Fixes Applied

### 1. Created Data Utility Functions
File: `/src/lib/data-utils.ts`

This file provides safe data access functions that handle undefined/null values gracefully.

### 2. Fix Outstanding Page

Replace the `useEffect` in `/src/app/finance/outstanding/page.tsx` (around line 23-36):

```typescript
import { normalizeInvoiceData, handleApiResponse } from '@/lib/data-utils'

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/invoices')
      const result = await response.json()
      const normalized = handleApiResponse(result, normalizeInvoiceData)
      setInvoices(normalized)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

### 3. Fix Purchase Orders Page

Replace the `useEffect` in `/src/app/purchase/orders/page.tsx` (around line 91-139):

```typescript
import { normalizePurchaseOrderData, handleApiResponse, safeArray } from '@/lib/data-utils'

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const [poRes, vendorRes, productRes] = await Promise.all([
        fetch('/api/purchase-orders'),
        fetch('/api/vendors'),
        fetch('/api/products')
      ])
      
      const poData = await poRes.json()
      const vendorData = await vendorRes.json()
      const productData = await productRes.json()

      setVendors(safeArray(vendorData.data || vendorData))
      setProducts(safeArray(productData.data || productData))
      
      if (poRes.ok) {
        const normalized = handleApiResponse(poData, normalizePurchaseOrderData)
        setPurchaseOrders(normalized)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('An error occurred while fetching data')
      setVendors([])
      setProducts([])
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

### 4. Add Sample Buyer Data

Run this SQL to add sample buyers:

```sql
-- Add sample buyers
INSERT INTO buyers (id, customer_id, name, designation, email, phone, is_primary, created_at)
VALUES 
  (gen_random_uuid(), (SELECT id FROM customers LIMIT 1), 'John Smith', 'Purchase Manager', 'john.smith@example.com', '+91-9876543210', true, NOW()),
  (gen_random_uuid(), (SELECT id FROM customers LIMIT 1), 'Sarah Johnson', 'Procurement Head', 'sarah.j@example.com', '+91-9876543211', false, NOW());
```

Or use the UI at `/masters/buyers` to add buyers manually.

## Alternative Quick Fix (Without Imports)

If you don't want to use the utility file, add these null checks directly:

### Outstanding Page - Line 55-60
```typescript
const outstandingInvoices = (invoices || []).filter(i => i?.status !== "paid")

const filteredInvoices = outstandingInvoices.filter(invoice =>
  (invoice?.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
  (invoice?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
)
```

### Purchase Orders - Line 105-106
```typescript
setVendors(Array.isArray(vendorData?.data) ? vendorData.data : (Array.isArray(vendorData) ? vendorData : []))
setProducts(Array.isArray(productData?.data) ? productData.data : (Array.isArray(productData) ? productData : []))
```

## Testing

After applying fixes:
1. Refresh the outstanding page: http://localhost:3000/finance/outstanding
2. Refresh the purchase orders page: http://localhost:3000/purchase/orders
3. Add buyers at: http://localhost:3000/masters/buyers

The pages should now load without errors, even with empty data.
