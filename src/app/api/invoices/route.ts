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
      sales_order:sales_orders(id, order_number),
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
    return apiError(validation.error.issues[0].message)
  }

  const { dispatch_id, due_date, remarks } = validation.data

  const { data: dispatch, error: dispatchError } = await adminClient
    .from('dispatches')
    .select(`
      *,
      sales_order:sales_orders(*, customer:customers(id, name, gstin, registered_state)),
      items:dispatch_items(*, product:products(id, name))
    `)
    .eq('id', dispatch_id)
    .single()

  if (dispatchError || !dispatch) {
    return apiError('Dispatch not found')
  }

  // Fetch company state from warehouse address (simplified: assuming default company for now)
  const { data: company } = await adminClient
    .from('companies')
    .select('warehouse_state')
    .eq('id', dispatch.company_id)
    .single()

  const placeOfSupply = company?.warehouse_state || 'Local'
  const isInterState = dispatch.sales_order.customer.registered_state !== placeOfSupply

  const { data: existingInvoice } = await adminClient
    .from('invoices')
    .select('id')
    .eq('dispatch_id', dispatch_id)
    .single()

  if (existingInvoice) {
    return apiError('An invoice already exists for this dispatch', 400)
  }

  const invoiceNumber = await generateDocumentNumber('INV', dispatch.company_id)

  let subtotal = 0
  const { data: soItems } = await adminClient
    .from('sales_order_items')
    .select('*')
    .eq('sales_order_id', dispatch.sales_order_id)

  const invoiceItems = dispatch.items.map((item: any) => {
    const soItem = soItems?.find((si: any) => si.id === item.sales_order_item_id)
    const unitPrice = soItem?.unit_price || 0
    const lineTotal = item.quantity * unitPrice
    subtotal += lineTotal

    return {
      product_id: item.product_id,
      sales_order_item_id: item.sales_order_item_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_amount: lineTotal,
      heat_number: item.heat_number,
      hsn_code: soItem?.hsn_code
    }
  })

  let cgst = 0, sgst = 0, igst = 0
  if (isInterState) {
    igst = subtotal * 0.18
  } else {
    cgst = subtotal * 0.09
    sgst = subtotal * 0.09
  }
  const total = subtotal + cgst + sgst + igst

  const { data: invoice, error: invoiceError } = await adminClient
    .from('invoices')
    .insert({
      company_id: dispatch.company_id,
      invoice_number: invoiceNumber,
      dispatch_id,
      sales_order_id: dispatch.sales_order_id,
      customer_id: dispatch.sales_order.customer_id,
      subtotal,
      cgst,
      sgst,
      igst,
      total_amount: total,
      currency: dispatch.sales_order.currency || 'INR',
      due_date,
      status: 'draft',
      paid_amount: 0,
      billing_address: dispatch.sales_order.billing_address,
      shipping_address: dispatch.sales_order.shipping_address,
      place_of_supply: placeOfSupply,
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
    .insert(invoiceItems.map((item: any) => ({
      ...item,
      invoice_id: invoice.id,
    })))

  if (itemsError) {
    await adminClient.from('invoices').delete().eq('id', invoice.id)
    return apiError(itemsError.message)
  }

  // Update invoiced_quantity on SO items
  for (const item of invoiceItems) {
    if (item.sales_order_item_id) {
      const { data: soItem } = await adminClient
        .from('sales_order_items')
        .select('invoiced_quantity')
        .eq('id', item.sales_order_item_id)
        .single()

      if (soItem) {
        await adminClient
          .from('sales_order_items')
          .update({ invoiced_quantity: (soItem.invoiced_quantity || 0) + item.quantity })
          .eq('id', item.sales_order_item_id)
      }
    }
  }

  const { error: rpcError } = await adminClient.rpc('increment_customer_outstanding', {
    p_customer_id: dispatch.sales_order.customer_id,
    p_amount: total
  })

  if (rpcError) {
    console.error('RPC Error:', rpcError)
    await adminClient
      .from('customers')
      .update({
        current_outstanding: adminClient.rpc('coalesce_add', {
          current_val: 0,
          add_val: total
        })
      })
      .eq('id', dispatch.sales_order.customer_id)
  }

  await logAuditEvent('invoices', invoice.id, 'CREATE', null, invoice, user.id)

  return apiSuccess(invoice, 201)
}
