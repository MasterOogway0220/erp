import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data: salesOrder, error } = await supabase
        .from('sales_orders')
        .select(`
      *,
      customer:customers(*),
      quotation:quotations(*),
      items:sales_order_items(*, product:products(*))
    `)
        .eq('id', id)
        .single()

    if (error) {
        return apiError('Sales Order not found', 404)
    }

    return apiSuccess(salesOrder)
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { items, ...soData } = body

    const { data: existingSO } = await adminClient
        .from('sales_orders')
        .select('*')
        .eq('id', id)
        .single()

    if (!existingSO) {
        return apiError('Sales Order not found', 404)
    }

    // Update SO basic data
    const { data: updatedSO, error: updateError } = await adminClient
        .from('sales_orders')
        .update({
            ...soData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (updateError) {
        return apiError(updateError.message)
    }

    // Update items if provided (status updates)
    if (items && Array.isArray(items)) {
        for (const item of items) {
            if (item.id) {
                await adminClient
                    .from('sales_order_items')
                    .update({
                        status: item.status,
                        production_status: item.production_status,
                        qc_status: item.qc_status,
                        delivered_quantity: item.delivered_quantity
                    })
                    .eq('id', item.id)
            }
        }
    }

    await logAuditEvent('sales_orders', id, 'UPDATE', existingSO, updatedSO, user.id)

    return apiSuccess(updatedSO)
}
