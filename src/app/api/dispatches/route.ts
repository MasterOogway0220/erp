import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createDispatchSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const soId = searchParams.get('sales_order_id')

  let query = supabase
    .from('dispatches')
    .select(`
      *,
      sales_order:sales_orders(id, order_number, customer:customers(id, name)),
      items:dispatch_items(*)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (soId) {
    query = query.eq('sales_order_id', soId)
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
  const validation = createDispatchSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const { sales_order_id, items, vehicle_number, driver_name, remarks } = validation.data

  const { data: so, error: soError } = await adminClient
    .from('sales_orders')
    .select(`
      *,
      customer:customers(id, name),
      items:sales_order_items(*)
    `)
    .eq('id', sales_order_id)
    .single()

  if (soError || !so) {
    return apiError('Sales Order not found')
  }

  if (!['open', 'in_progress', 'partial_dispatch'].includes(so.status)) {
    return apiError('Dispatch can only be created for open, in-progress, or partially dispatched Sales Orders', 400)
  }

  for (const item of items) {
    const { data: invItem, error: invError } = await adminClient
      .from('inventory')
      .select('*')
      .eq('id', item.inventory_id)
      .single()

    if (invError || !invItem) {
      return apiError(`Inventory item not found: ${item.inventory_id}`)
    }

    if (invItem.inspection_status !== 'accepted') {
      return apiError('Only QC-accepted inventory can be dispatched', 400)
    }

    if (invItem.available_quantity < item.quantity) {
      return apiError(`Insufficient available quantity for item. Available: ${invItem.available_quantity}, Requested: ${item.quantity}`, 400)
    }
  }

  const dispatchNumber = await generateDocumentNumber('DSP')

  const { data: dispatch, error: dispatchError } = await adminClient
    .from('dispatches')
    .insert({
      dispatch_number: dispatchNumber,
      sales_order_id,
      dispatch_date: new Date().toISOString().split('T')[0],
      vehicle_number,
      driver_name,
      status: 'pending',
      remarks,
      created_by: user.id,
    })
    .select()
    .single()

  if (dispatchError) {
    return apiError(dispatchError.message)
  }

  const dispatchItems = items.map(item => ({
    dispatch_id: dispatch.id,
    inventory_id: item.inventory_id,
    product_id: item.product_id,
    sales_order_item_id: item.sales_order_item_id,
    quantity: item.quantity,
    heat_number: item.heat_number,
  }))

  const { error: itemsError } = await adminClient
    .from('dispatch_items')
    .insert(dispatchItems)

  if (itemsError) {
    await adminClient.from('dispatches').delete().eq('id', dispatch.id)
    return apiError(itemsError.message)
  }

  for (const item of items) {
    const { data: invItem } = await adminClient
      .from('inventory')
      .select('available_quantity, reserved_quantity')
      .eq('id', item.inventory_id)
      .single()

    if (invItem) {
      await adminClient
        .from('inventory')
        .update({
          available_quantity: invItem.available_quantity - item.quantity,
          reserved_quantity: invItem.reserved_quantity + item.quantity,
        })
        .eq('id', item.inventory_id)
    }
  }

  // 5. Update SO Items delivered quantity based on sales_order_item_id
  for (const item of items) {
    if (item.sales_order_item_id) {
      const { data: soItem } = await adminClient
        .from('sales_order_items')
        .select('delivered_quantity')
        .eq('id', item.sales_order_item_id)
        .single()

      if (soItem) {
        await adminClient
          .from('sales_order_items')
          .update({ delivered_quantity: (soItem.delivered_quantity || 0) + item.quantity })
          .eq('id', item.sales_order_item_id)
      }
    }
  }

  const { data: updatedSOItems } = await adminClient
    .from('sales_order_items')
    .select('quantity, delivered_quantity')
    .eq('sales_order_id', sales_order_id)

  const allDelivered = updatedSOItems?.every(
    (item: { quantity: number; delivered_quantity: number }) => item.delivered_quantity >= item.quantity
  )
  const someDelivered = updatedSOItems?.some(
    (item: { delivered_quantity: number }) => item.delivered_quantity > 0
  )

  const newSOStatus = allDelivered ? 'completed' : someDelivered ? 'partial_dispatch' : 'in_progress'

  await adminClient
    .from('sales_orders')
    .update({ status: newSOStatus })
    .eq('id', sales_order_id)

  await logAuditEvent('dispatches', dispatch.id, 'CREATE', null, dispatch, user.id)

  return apiSuccess(dispatch, 201)
}
