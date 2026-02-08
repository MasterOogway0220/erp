import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
        .from('dispatches')
        .select(`
      *,
      sales_order:sales_orders(
        *,
        customer:customers(*)
      ),
      items:dispatch_items(
        *,
        product:products(id, name)
      ),
      invoices(*)
    `)
        .eq('id', id)
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { status, remarks } = body

    const { data: current, error: fetchError } = await adminClient
        .from('dispatches')
        .select('status')
        .eq('id', id)
        .single()

    if (fetchError || !current) {
        return apiError('Dispatch not found')
    }

    const { data, error } = await adminClient
        .from('dispatches')
        .update({
            status,
            remarks: remarks || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    await logAuditEvent('dispatches', id, 'STATUS_CHANGE', current.status, status, user.id)

    return apiSuccess(data)
}
