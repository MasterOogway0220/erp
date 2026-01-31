import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { createBuyerSchema } from '@/lib/validations/schemas'

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

    const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
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
    const validation = createBuyerSchema.partial().safeParse(body)

    if (!validation.success) {
        return apiError(validation.error.issues[0].message)
    }

    // If this buyer is marked as primary, unmark others for the same customer
    if (validation.data.is_primary_contact && validation.data.customer_id) {
        await adminClient
            .from('buyers')
            .update({ is_primary_contact: false })
            .eq('customer_id', validation.data.customer_id)
            .neq('id', id)
    }

    const { data: existingBuyer } = await adminClient
        .from('buyers')
        .select('*')
        .eq('id', id)
        .single()

    const { data, error } = await adminClient
        .from('buyers')
        .update({
            ...body,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    await logAuditEvent('buyers', id, 'UPDATE', existingBuyer, data, user.id)

    return apiSuccess(data)
}

export async function DELETE(
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

    const { error } = await adminClient
        .from('buyers')
        .delete()
        .eq('id', id)

    if (error) {
        return apiError(error.message)
    }

    await logAuditEvent('buyers', id, 'DELETE', null, null, user.id)

    return apiSuccess(null, 204)
}
