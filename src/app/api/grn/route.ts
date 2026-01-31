import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data, error } = await supabase
    .from('grn')
    .select('*, vendor:vendors(*), items:grn_items(*, product:products(*))')
    .order('created_at', { ascending: false })

  if (error) {
    return apiError(error.message)
  }

  return apiSuccess(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const body = await request.json()
  const {
    po_id,
    received_by,
    received_date,
    warehouse_id,
    items, // Array of { product_id, received_quantity, heat_number }
    remarks
  } = body

  if (!po_id || !received_by || !warehouse_id || !items || items.length === 0) {
    return apiError('Missing required fields', 400)
  }

  // 1. Create GRN Header
  const { data: grn, error: grnError } = await supabase
    .from('grn')
    .insert({
      po_id,
      received_by,
      received_date: received_date || new Date().toISOString(),
      warehouse_id,
      status: 'pending_inspection',
      remarks
    })
    .select()
    .single()

  if (grnError) return apiError(grnError.message)

  // 2. Create GRN Items and Update Inventory
  for (const item of items) {
    // Add GRN Item
    const { error: itemError } = await supabase
      .from('grn_items')
      .insert({
        grn_id: grn.id,
        product_id: item.product_id,
        received_quantity: item.received_quantity,
        heat_number: item.heat_number,
        inspection_status: 'pending'
      })

    if (itemError) console.error('Error adding GRN item:', itemError)

    // Add to Inventory (QC-HOLD)
    const { error: invError } = await supabase
      .from('inventory')
      .insert({
        product_id: item.product_id,
        warehouse_id: warehouse_id,
        quantity: item.received_quantity,
        heat_number: item.heat_number,
        inspection_status: 'pending',
        location: 'QC-HOLD',
        grn_id: grn.id
      })

    if (invError) console.error('Error updating inventory:', invError)

    // Update PO received quantity
    const { data: poItem } = await supabase
      .from('purchase_order_items')
      .select('received_quantity')
      .eq('purchase_order_id', po_id)
      .eq('product_id', item.product_id)
      .single()

    if (poItem) {
      await supabase
        .from('purchase_order_items')
        .update({ received_quantity: (poItem.received_quantity || 0) + item.received_quantity })
        .eq('purchase_order_id', po_id)
        .eq('product_id', item.product_id)
    }
  }

  // 3. Update PO Status
  const { data: allPoItems } = await supabase
    .from('purchase_order_items')
    .select('quantity, received_quantity')
    .eq('purchase_order_id', po_id)

  if (allPoItems) {
    const totalOrdered = allPoItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalReceived = allPoItems.reduce((sum, item) => sum + (item.received_quantity || 0), 0)

    let newStatus = 'partial_received'
    if (totalReceived >= totalOrdered) newStatus = 'received'

    await supabase
      .from('purchase_orders')
      .update({ status: newStatus })
      .eq('id', po_id)
  }

  return apiSuccess(grn, 201)
}
