import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const createNCRSchema = z.object({
  grn_id: z.string().uuid().optional(),
  inventory_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  heat_number: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  product_name: z.string().optional(),
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
    .from('ncr')
    .select(`
      *,
      product:products(id, name)
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
  const validation = createNCRSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { grn_id, inventory_id, product_id, heat_number, description, product_name } = validation.data
  
  const ncrNumber = await generateDocumentNumber('NCR')
  
  const { data: ncr, error: ncrError } = await adminClient
    .from('ncr')
    .insert({
      ncr_number: ncrNumber,
      grn_id,
      inventory_id,
      product_id,
      product_name,
      heat_number,
      description,
      status: 'open',
      raised_by: user.id,
      created_at: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()
  
  if (ncrError) {
    return apiError(ncrError.message)
  }
  
  await logAuditEvent('ncr', ncr.id, 'CREATE', null, ncr, user.id)
  
  return apiSuccess(ncr, 201)
}
