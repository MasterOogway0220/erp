import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { isValidStatusTransition } from '@/lib/validations/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data, error } = await supabase
    .from('enquiries')
    .select(`
      *,
      customer:customers(id, name, email, address, phone),
      buyer:buyers(id, buyer_name, designation, email, mobile),
      items:enquiry_items(*, product:products(id, name, code))
    `)
    .eq('id', id)
    .single()

  if (error) {
    return apiError('Enquiry not found', 404)
  }

  return apiSuccess(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const body = await request.json()
  const { status, remarks } = body

  // Fetch current enquiry
  const { data: current, error: fetchError } = await adminClient
    .from('enquiries')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return apiError('Enquiry not found', 404)
  }

  // Validate status transition if status is being updated
  if (status && !isValidStatusTransition('enquiry', current.status, status)) {
    return apiError(`Cannot transition from ${current.status} to ${status}`, 400)
  }

  // Update enquiry
  const updateData: any = {}
  if (status) updateData.status = status
  if (remarks !== undefined) updateData.remarks = remarks

  const { data, error } = await adminClient
    .from('enquiries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return apiError(error.message)
  }

  await logAuditEvent('enquiries', id, 'UPDATE', current, data, user.id)

  return apiSuccess(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  // Fetch enquiry to check if it can be deleted
  const { data: enquiry, error: fetchError } = await adminClient
    .from('enquiries')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError || !enquiry) {
    return apiError('Enquiry not found', 404)
  }

  // Only allow deletion of open enquiries
  if (enquiry.status !== 'open') {
    return apiError('Only open enquiries can be deleted', 400)
  }

  // Soft delete by updating status to 'closed'
  const { data, error } = await adminClient
    .from('enquiries')
    .update({ status: 'closed', remarks: 'Deleted by user' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return apiError(error.message)
  }

  await logAuditEvent('enquiries', id, 'DELETE', enquiry, data, user.id)

  return apiSuccess({ message: 'Enquiry deleted successfully' })
}
