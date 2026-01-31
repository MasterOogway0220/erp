import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { createBuyerSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
        .from('buyers')
        .select(`
            *,
            customer:customers(id, name)
        `)
        .order('name', { ascending: true })

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
    const validation = createBuyerSchema.safeParse(body)

    if (!validation.success) {
        return apiError(validation.error.issues[0].message)
    }

    // If this buyer is marked as primary, unmark others for the same customer
    if (validation.data.is_primary_contact) {
        await adminClient
            .from('buyers')
            .update({ is_primary_contact: false })
            .eq('customer_id', validation.data.customer_id)
    }

    const { data, error } = await adminClient
        .from('buyers')
        .insert(validation.data)
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    await logAuditEvent('buyers', data.id, 'CREATE', null, data, user.id)

    return apiSuccess(data, 201)
}
