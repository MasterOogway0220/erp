import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createSalesOrderSchema } from '@/lib/validations/schemas'

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
    .from('sales_orders')
    .select(`
      *,
      customer:customers(id, name),
      quotation:quotations(id, quotation_number),
      items:sales_order_items(*)
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
  const validation = createSalesOrderSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }

  const { quotation_id, customer_po_number, delivery_date, remarks } = validation.data

  const { data: quotation, error: quotationError } = await adminClient
    .from('quotations')
    .select(`
      *,
      customer:customers(id, name),
      items:quotation_items(*)
    `)
    .eq('id', quotation_id)
    .single()

  if (quotationError || !quotation) {
    return apiError('Quotation not found')
  }

  if (quotation.status !== 'approved' && quotation.status !== 'sent') {
    return apiError('Sales Order can only be created from an approved or sent quotation', 400)
  }

  const { data: existingSO } = await adminClient
    .from('sales_orders')
    .select('id')
    .eq('quotation_id', quotation_id)
    .single()

  if (existingSO) {
    return apiError('A Sales Order already exists for this quotation', 400)
  }

  const { data: customer } = await adminClient
    .from('customers')
    .select('id, name, credit_limit, current_outstanding')
    .eq('id', quotation.customer_id)
    .single()

  if (customer && customer.credit_limit > 0) {
    const newOutstanding = (customer.current_outstanding || 0) + quotation.total
    if (newOutstanding > customer.credit_limit) {
      return apiError(
        `Credit limit exceeded. Customer credit limit: ₹${customer.credit_limit.toLocaleString()}, Current outstanding: ₹${(customer.current_outstanding || 0).toLocaleString()}, Order value: ₹${quotation.total.toLocaleString()}`,
        400
      )
    }
  }

  const soNumber = await generateDocumentNumber('SO')

  const { data: salesOrder, error: soError } = await adminClient
    .from('sales_orders')
    .insert({
      so_number: soNumber,
      quotation_id,
      customer_id: quotation.customer_id,
      customer_po_number,
      subtotal: quotation.subtotal,
      tax_amount: quotation.tax_amount,
      total_amount: quotation.total_amount,
      currency: quotation.currency,
      delivery_date,
      status: 'open',
      remarks,
      created_by: user.id,
    })
    .select()
    .single()


  if (soError) {
    return apiError(soError.message)
  }

  const soItems = quotation.items.map((item: { product_id: string; quantity: number; unit_price: number }) => ({
    sales_order_id: salesOrder.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    delivered_quantity: 0,
  }))

  const { error: itemsError } = await adminClient
    .from('sales_order_items')
    .insert(soItems)

  if (itemsError) {
    await adminClient.from('sales_orders').delete().eq('id', salesOrder.id)
    return apiError(itemsError.message)
  }

  await adminClient
    .from('quotations')
    .update({ status: 'accepted' })
    .eq('id', quotation_id)

  await logAuditEvent('sales_orders', salesOrder.id, 'CREATE', null, salesOrder, user.id)

  return apiSuccess(salesOrder, 201)
}
