import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const updateNCRSchema = z.object({
  status: z.enum(['open', 'under_investigation', 'action_taken', 'closed']).optional(),
  corrective_action: z.string().optional(),
  root_cause: z.string().optional(),
  closed_at: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { data, error } = await supabase
    .from('ncr')
    .select(`
      *,
      product:products(id, name)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    return apiError(error.message)
  }
  
  return apiSuccess(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const body = await request.json()
  const validation = updateNCRSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { data: ncr, error: fetchError } = await adminClient
    .from('ncr')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError || !ncr) {
    return apiError('NCR not found')
  }
  
  const oldData = { ...ncr }
  
  const { data: updated, error: updateError } = await adminClient
    .from('ncr')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single()
  
  if (updateError) {
    return apiError(updateError.message)
  }
  
  await logAuditEvent('ncr', id, 'UPDATE', oldData, updated, user.id)
  
  return apiSuccess(updated)
}
