import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { isValidStatusTransition } from '@/lib/validations/schemas'

export async function POST(
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
    const { approved, remarks } = body

    if (typeof approved !== 'boolean') {
        return apiError('Approved field is required and must be boolean', 400)
    }

    // Fetch current quotation
    const { data: quotation, error: fetchError } = await adminClient
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !quotation) {
        return apiError('Quotation not found', 404)
    }

    // Check current status
    if (quotation.status !== 'pending_approval') {
        return apiError('Quotation is not pending approval', 400)
    }

    const newStatus = approved ? 'approved' : 'rejected'

    // Validate transition
    if (!isValidStatusTransition('quotation', quotation.status, newStatus)) {
        return apiError(`Invalid status transition from ${quotation.status} to ${newStatus}`, 400)
    }

    // Update quotation
    const { data, error } = await adminClient
        .from('quotations')
        .update({
            status: newStatus,
            approved_by: approved ? user.id : null,
            approved_at: approved ? new Date().toISOString() : null,
            rejection_reason: !approved ? remarks : null
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    await logAuditEvent('quotations', id, 'STATUS_CHANGE', quotation, data, user.id)

    return apiSuccess(data)
}
