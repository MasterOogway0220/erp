import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createPurchaseOrderSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const vendorId = searchParams.get('vendor_id')
  
  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      vendor:vendors(id, name),
      items:purchase_order_items(*)
    `)
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  if (vendorId) {
    query = query.eq('vendor_id', vendorId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return apiError(error.message)
  }
  
  return apiSuccess(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const body = await request.json()
  const validation = createPurchaseOrderSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { vendor_id, sales_order_id, items, delivery_date, remarks } = validation.data
  
  const { data: vendor, error: vendorError } = await adminClient
    .from('vendors')
    .select('id, name, is_approved')
    .eq('id', vendor_id)
    .single()
  
  if (vendorError || !vendor) {
    return apiError('Vendor not found')
  }
  
  if (!vendor.is_approved) {
    return apiError('Purchase Order can only be created for approved vendors', 400)
  }
  
  const { data: products } = await adminClient
    .from('products')
    .select('id, name, base_price')
    .in('id', items.map(i => i.product_id))
  
  if (!products || products.length !== items.length) {
    return apiError('One or more products not found')
  }
  
  const poNumber = await generateDocumentNumber('PO')
  
  let subtotal = 0
  const processedItems = items.map(item => {
    const lineTotal = item.quantity * item.unit_price
    subtotal += lineTotal
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      received_quantity: 0,
      heat_number: item.heat_number || null,
    }
  })
  
  const tax = subtotal * 0.18
  const total = subtotal + tax
  
  const { data: purchaseOrder, error: poError } = await adminClient
    .from('purchase_orders')
    .insert({
      po_number: poNumber,
      vendor_id,
      sales_order_id,
      subtotal,
      tax,
      total,
      delivery_date,
      status: 'draft',
      revision: 1,
      remarks,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (poError) {
    return apiError(poError.message)
  }
  
  const { error: itemsError } = await adminClient
    .from('purchase_order_items')
    .insert(processedItems.map(item => ({
      ...item,
      purchase_order_id: purchaseOrder.id,
    })))
  
  if (itemsError) {
    await adminClient.from('purchase_orders').delete().eq('id', purchaseOrder.id)
    return apiError(itemsError.message)
  }
  
  await logAuditEvent('purchase_orders', purchaseOrder.id, 'CREATE', null, purchaseOrder, user.id)
  
  return apiSuccess(purchaseOrder, 201)
}
