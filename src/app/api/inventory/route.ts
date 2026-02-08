import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { inspectionSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('inspection_status')
  const productId = searchParams.get('product_id')
  const heatNumber = searchParams.get('heat_number')
  const warehouseId = searchParams.get('warehouse_id')
  const search = searchParams.get('search')

  let query = supabase
    .from('inventory')
    .select(`
      *,
      product:products!inner(id, name, code, material_grade, standard),
      grn:grn(id, grn_number),
      warehouse:warehouses(id, name, code)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('inspection_status', status)
  }
  if (productId) {
    query = query.eq('product_id', productId)
  }
  if (heatNumber) {
    query = query.ilike('heat_number', `%${heatNumber}%`)
  }
  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId)
  }
  if (search) {
    // Search across name, code, heat_number
    query = query.or(`heat_number.ilike.%${search}%,product.name.ilike.%${search}%,product.code.ilike.%${search}%`)
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
  const validation = inspectionSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const { grn_id, inventory_id, result, checklist, test_results, remarks } = validation.data

  const { data: invItem, error: invError } = await adminClient
    .from('inventory')
    .select('*')
    .eq('id', inventory_id)
    .single()

  if (invError || !invItem) {
    return apiError('Inventory item not found')
  }

  if (invItem.inspection_status !== 'under_inspection') {
    return apiError('Item is not pending inspection', 400)
  }

  const oldData = { ...invItem }
  let newAvailableQty = 0

  if (result === 'accepted') {
    newAvailableQty = invItem.quantity
  }

  const { data: updated, error: updateError } = await adminClient
    .from('inventory')
    .update({
      inspection_status: result,
      available_quantity: newAvailableQty,
      location: result === 'accepted' ? 'WH-MAIN' : result === 'rejected' ? 'WH-REJ' : 'QC-HOLD',
    })
    .eq('id', inventory_id)
    .select()
    .single()

  if (updateError) {
    return apiError(updateError.message)
  }

  const { data: inspection, error: inspError } = await adminClient
    .from('inspections')
    .insert({
      grn_id,
      inventory_id,
      result,
      checklist,
      remarks,
      heat_number: invItem.heat_number,
      inspected_by: user.id,
    })
    .select()
    .single()

  if (inspError) {
    return apiError(inspError.message)
  }

  // Persist granular test results if provided
  if (test_results && test_results.length > 0) {
    const { error: resultsError } = await adminClient
      .from('inspection_test_results')
      .insert(test_results.map(tr => ({
        ...tr,
        inspection_id: inspection.id
      })))

    if (resultsError) {
      console.error('Failed to save test results:', resultsError)
    }
  }

  if (result === 'rejected') {
    const { data: ncrNumber } = await adminClient.rpc('get_next_sequence', { p_prefix: `NCR-${new Date().getFullYear()}` })

    await adminClient.from('ncr').insert({
      ncr_number: `NCR-${new Date().getFullYear()}-${(ncrNumber || Math.floor(1000 + Math.random() * 9000)).toString().padStart(4, '0')}`,
      grn_id,
      inventory_id,
      product_id: invItem.product_id,
      heat_number: invItem.heat_number,
      description: `QC Rejection - ${remarks || 'Failed inspection'}`,
      status: 'open',
      raised_by: user.id,
    })
  }

  await adminClient
    .from('grn_items')
    .update({ inspection_status: result })
    .eq('grn_id', grn_id)
    .eq('heat_number', invItem.heat_number)

  const { data: grnItems } = await adminClient
    .from('grn_items')
    .select('inspection_status')
    .eq('grn_id', grn_id)

  const allInspected = grnItems?.every(
    (item: { inspection_status: string }) => item.inspection_status !== 'pending'
  )

  if (allInspected) {
    await adminClient
      .from('grn')
      .update({ status: 'inspected' })
      .eq('id', grn_id)
  }

  await logAuditEvent('inventory', inventory_id, 'STATUS_CHANGE', oldData, updated, user.id)

  return apiSuccess({ inspection, inventory: updated }, 201)
}
