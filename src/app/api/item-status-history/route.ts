import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const soItemId = searchParams.get('so_item_id')

    if (!soItemId) {
        return apiError('Sales order item ID is required')
    }

    const { data, error } = await supabase
        .from('item_status_history')
        .select(`
      *,
      updated_by_user:auth.users(id, email)
    `)
        .eq('so_item_id', soItemId)
        .order('updated_at', { ascending: false })

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
    const { so_item_id, status, notes } = body

    // Validate status
    const validStatuses = [
        'SO_CONFIRMED',
        'PO_PLACED',
        'MATERIAL_RECEIVED',
        'UNDER_QC',
        'QC_ACCEPTED',
        'QC_REJECTED',
        'READY_TO_DISPATCH',
        'DISPATCHED',
        'INVOICED',
        'PAID'
    ]

    if (!validStatuses.includes(status)) {
        return apiError('Invalid status')
    }

    // Update sales order item status
    const { error: updateError } = await adminClient
        .from('sales_order_items')
        .update({ status })
        .eq('id', so_item_id)

    if (updateError) {
        return apiError(updateError.message)
    }

    // Create history record
    const { data, error } = await adminClient
        .from('item_status_history')
        .insert({
            so_item_id,
            status,
            notes,
            updated_by: user.id,
        })
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data, 201)
}
