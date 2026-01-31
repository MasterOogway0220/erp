import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const purchaseRequestItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  required_date: z.string(),
  so_reference: z.string().optional(),
})

const createPurchaseRequestSchema = z.object({
  items: z.array(purchaseRequestItemSchema).min(1, "At least one item is required"),
  remarks: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  let query = supabase
    .from('purchase_requests')
    .select(`
      *,
      items:purchase_request_items(*, product:products(id, name, code))
    `)
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
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
  const validation = createPurchaseRequestSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { items, remarks } = validation.data
  
  const { data: products } = await adminClient
    .from('products')
    .select('id, name')
    .in('id', items.map(i => i.product_id))
  
  if (!products || products.length !== items.length) {
    return apiError('One or more products not found')
  }
  
  const prNumber = await generateDocumentNumber('PR')
  
  const { data: pr, error: prError } = await adminClient
    .from('purchase_requests')
    .insert({
      pr_number: prNumber,
      status: 'draft',
      remarks,
      requested_by: user.id,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (prError) {
    return apiError(prError.message)
  }
  
  const prItems = items.map(item => ({
    purchase_request_id: pr.id,
    product_id: item.product_id,
    quantity: item.quantity,
    required_date: item.required_date,
    so_reference: item.so_reference,
  }))
  
  const { error: itemsError } = await adminClient
    .from('purchase_request_items')
    .insert(prItems)
  
  if (itemsError) {
    await adminClient.from('purchase_requests').delete().eq('id', pr.id)
    return apiError(itemsError.message)
  }
  
  await logAuditEvent('purchase_requests', pr.id, 'CREATE', null, pr, user.id)
  
  return apiSuccess(pr, 201)
}
