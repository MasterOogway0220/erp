import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createInvoiceSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const customerId = searchParams.get('customer_id')
  
  let query = supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name),
      dispatch:dispatches(id, dispatch_number),
      sales_order:sales_orders(id, so_number),
      items:invoice_items(*)
    `)
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  if (customerId) {
    query = query.eq('customer_id', customerId)
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
  const validation = createInvoiceSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { dispatch_id, due_date, remarks } = validation.data
  
  const { data: dispatch, error: dispatchError } = await adminClient
    .from('dispatches')
    .select(`
      *,
      sales_order:sales_orders(*, customer:customers(id, name, gst_number)),
      items:dispatch_items(*, product:products(id, name))
    `)
    .eq('id', dispatch_id)
    .single()
  
  if (dispatchError || !dispatch) {
    return apiError('Dispatch not found')
  }
  
  if (dispatch.status !== 'dispatched' && dispatch.status !== 'delivered') {
    return apiError('Invoice can only be created for dispatched or delivered goods', 400)
  }
  
  const { data: existingInvoice } = await adminClient
    .from('invoices')
    .select('id')
    .eq('dispatch_id', dispatch_id)
    .single()
  
  if (existingInvoice) {
    return apiError('An invoice already exists for this dispatch', 400)
  }
  
  const invoiceNumber = await generateDocumentNumber('INV')
  
  let subtotal = 0
  const invoiceItems = dispatch.items.map((item: { 
    product_id: string; 
    quantity: number; 
    heat_number: string;
    product: { name: string };
  }) => {
    const soItem = dispatch.sales_order.items?.find(
      (si: { product_id: string; unit_price: number }) => si.product_id === item.product_id
    )
    const unitPrice = soItem?.unit_price || 0
    const lineTotal = item.quantity * unitPrice
    subtotal += lineTotal
    
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      total: lineTotal,
      heat_number: item.heat_number,
    }
  })
  
  const cgst = subtotal * 0.09
  const sgst = subtotal * 0.09
  const igst = 0
  const total = subtotal + cgst + sgst + igst
  
  const { data: invoice, error: invoiceError } = await adminClient
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      dispatch_id,
      sales_order_id: dispatch.sales_order_id,
      customer_id: dispatch.sales_order.customer_id,
      subtotal,
      cgst,
      sgst,
      igst,
      total,
      currency: dispatch.sales_order.currency || 'INR',
      due_date,
      status: 'draft',
      paid_amount: 0,
      remarks,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (invoiceError) {
    return apiError(invoiceError.message)
  }
  
  const { error: itemsError } = await adminClient
    .from('invoice_items')
    .insert(invoiceItems.map((item: { product_id: string; quantity: number; unit_price: number; total: number; heat_number: string }) => ({
      ...item,
      invoice_id: invoice.id,
    })))
  
  if (itemsError) {
    await adminClient.from('invoices').delete().eq('id', invoice.id)
    return apiError(itemsError.message)
  }
  
  await adminClient.rpc('increment_customer_outstanding', {
    p_customer_id: dispatch.sales_order.customer_id,
    p_amount: total
  }).catch(() => {
    adminClient
      .from('customers')
      .update({ 
        current_outstanding: adminClient.rpc('coalesce_add', { 
          current_val: 0, 
          add_val: total 
        })
      })
      .eq('id', dispatch.sales_order.customer_id)
  })
  
  await logAuditEvent('invoices', invoice.id, 'CREATE', null, invoice, user.id)
  
  return apiSuccess(invoice, 201)
}
