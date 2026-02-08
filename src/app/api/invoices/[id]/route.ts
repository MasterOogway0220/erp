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
        .from('invoices')
        .select(`
      *,
      customer:customers(*),
      dispatch:dispatches(*),
      sales_order:sales_orders(*),
      items:invoice_items(
        *,
        product:products(id, name)
      ),
      receipts:payment_receipts(*)
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
    const { status, remarks, paid_amount } = body

    const { data: current, error: fetchError } = await adminClient
        .from('invoices')
        .select('status, paid_amount')
        .eq('id', id)
        .single()

    if (fetchError || !current) {
        return apiError('Invoice not found')
    }

    const updates: any = {
        status: status || current.status,
        remarks: remarks || null,
        updated_at: new Date().toISOString()
    }

    if (paid_amount !== undefined) {
        updates.paid_amount = paid_amount
    }

    const { data, error } = await adminClient
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    if (status && status !== current.status) {
        await logAuditEvent('invoices', id, 'STATUS_CHANGE', current.status, status, user.id)
    }

    return apiSuccess(data)
}
