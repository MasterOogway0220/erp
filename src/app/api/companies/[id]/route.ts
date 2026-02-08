import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { createCompanySchema } from '@/lib/validations/schemas'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return apiError(error.message)
    return apiSuccess(data)
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    // Partial validation since it's an update
    const validation = createCompanySchema.partial().safeParse(body)

    if (!validation.success) {
        return apiError(validation.error.issues[0].message)
    }

    const { data: oldData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

    const { data, error } = await adminClient
        .from('companies')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single()

    if (error) return apiError(error.message)

    await logAuditEvent('companies', id, 'UPDATE', oldData, data, user.id)

    return apiSuccess(data)
}
