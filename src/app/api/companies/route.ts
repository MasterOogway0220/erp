import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { createCompanySchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
        .from('companies')
        .select('*')
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
    const validation = createCompanySchema.safeParse(body)

    if (!validation.success) {
        return apiError(validation.error.errors[0].message)
    }

    const { data, error } = await adminClient
        .from('companies')
        .insert(validation.data)
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    await logAuditEvent('companies', data.id, 'CREATE', null, data, user.id)

    return apiSuccess(data, 201)
}
