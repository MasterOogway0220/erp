import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { approveQuotationSchema, isValidStatusTransition } from '@/lib/validations/schemas'

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
    .from('quotations')
    .select(`
      *,
      customer:customers(id, name, email, address, gst_number),
      enquiry:enquiries(id, enquiry_number),
      items:quotation_items(*, product:products(id, name, code)),
      terms:quotation_terms(*, term_details:terms_conditions(*))
    `)
    .order('display_order', { foreignTable: 'quotation_terms', ascending: true })
    .eq('id', id)
    .single()

  if (error) {
    return apiError('Quotation not found', 404)
  }

  // Fetch all revisions of the same quotation number
  const { data: revisions } = await supabase
    .from('quotations')
    .select('id, quotation_number, version_number, revision, status, created_at, is_latest_version')
    .eq('quotation_number', data.quotation_number)
    .order('version_number', { ascending: false })

  return apiSuccess({
    ...data,
    revisions: revisions || []
  })
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
  const { action, remarks } = body

  const { data: quotation, error: fetchError } = await adminClient
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !quotation) {
    return apiError('Quotation not found', 404)
  }

  const oldData = { ...quotation }
  let newStatus = quotation.status
  let updates: Record<string, unknown> = {}

  switch (action) {
    case 'submit_for_approval':
      if (!isValidStatusTransition('quotation', quotation.status, 'pending_approval')) {
        return apiError(`Cannot submit quotation from status: ${quotation.status}`)
      }
      newStatus = 'pending_approval'
      updates = { status: newStatus }
      break

    case 'approve':
      // ISO 8.2.3: Mandatory remarks for requirements review
      if (!remarks || remarks.trim().length === 0) {
        return apiError('Approval remarks are mandatory for ISO 8.2.3 compliance', 400)
      }
      if (!isValidStatusTransition('quotation', quotation.status, 'approved')) {
        return apiError(`Cannot approve quotation from status: ${quotation.status}`)
      }
      newStatus = 'approved'
      updates = {
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        remarks
      }
      break

    case 'reject':
      // ISO 8.2.3: Mandatory remarks for rejection
      if (!remarks || remarks.trim().length === 0) {
        return apiError('Rejection remarks are mandatory for ISO 8.2.3 compliance', 400)
      }
      if (!isValidStatusTransition('quotation', quotation.status, 'rejected')) {
        return apiError(`Cannot reject quotation from status: ${quotation.status}`)
      }
      newStatus = 'rejected'
      updates = { status: newStatus, remarks }
      break

    case 'send':
      if (!isValidStatusTransition('quotation', quotation.status, 'sent')) {
        return apiError(`Cannot send quotation from status: ${quotation.status}`)
      }
      newStatus = 'sent'
      updates = { status: newStatus }
      break

    default:
      return apiError('Invalid action')
  }

  const { data: updated, error: updateError } = await adminClient
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return apiError(updateError.message)
  }

  await logAuditEvent('quotations', id, 'STATUS_CHANGE', oldData, updated, user.id)

  return apiSuccess(updated)
}
