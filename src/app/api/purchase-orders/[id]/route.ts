import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { isValidStatusTransition } from '@/lib/validations/schemas'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
      *,
      vendor:vendors(*),
      items:purchase_order_items(
        *,
        product:products(id, name, code)
      ),
      sales_order:sales_orders(id, order_number),
      grns:grn(*)
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
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { action, remarks } = body

    // Fetch current PO
    const { data: po, error: fetchError } = await adminClient
        .from('purchase_orders')
        .select('status, company_id, remarks')
        .eq('id', id)
        .single()

    if (fetchError || !po) {
        return apiError('Purchase Order not found')
    }

    let newStatus = po.status
    let updates: any = {}

    switch (action) {
        case 'approve':
            if (!isValidStatusTransition('purchase_order', po.status, 'approved')) {
                return apiError(`Cannot approve PO from status: ${po.status}`)
            }
            newStatus = 'approved'
            updates = {
                status: newStatus,
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                remarks: remarks || po.remarks
            }
            break

        case 'send':
            if (!isValidStatusTransition('purchase_order', po.status, 'sent')) {
                return apiError(`Cannot send PO from status: ${po.status}`)
            }
            newStatus = 'sent'
            updates = {
                status: newStatus,
                sent_at: new Date().toISOString()
            }
            break

        case 'acknowledge':
            if (!isValidStatusTransition('purchase_order', po.status, 'acknowledged')) {
                // Technically 'sent' -> 'acknowledged'
                return apiError(`Cannot acknowledge PO from status: ${po.status}`)
            }
            newStatus = 'acknowledged'
            updates = {
                status: newStatus,
                acknowledged_at: new Date().toISOString()
            }
            break

        case 'cancel':
            if (!isValidStatusTransition('purchase_order', po.status, 'cancelled')) {
                return apiError(`Cannot cancel PO from status: ${po.status}`)
            }
            newStatus = 'cancelled'
            updates = { status: newStatus, remarks: remarks || po.remarks }
            break

        default:
            if (body.status) {
                if (!isValidStatusTransition('purchase_order', po.status, body.status)) {
                    return apiError(`Invalid status transition from ${po.status} to ${body.status}`)
                }
                newStatus = body.status
                updates = { status: newStatus }
            } else {
                return apiError('Invalid action or status')
            }
    }

    const { data: updatedPO, error: updateError } = await adminClient
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (updateError) {
        return apiError(updateError.message)
    }

    await logAuditEvent('purchase_orders', id, 'STATUS_CHANGE', { status: po.status }, { status: newStatus }, user.id)

    return apiSuccess(updatedPO)
}
