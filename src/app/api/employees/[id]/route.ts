import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { createEmployeeSchema } from '@/lib/validations/schemas'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return apiError(error.message)
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
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const validation = createEmployeeSchema.partial().safeParse(body)

    if (!validation.success) {
        return apiError(validation.error.errors[0].message)
    }

    const { data: oldData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

    const { data, error } = await adminClient
        .from('employees')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single()

    if (error) return apiError(error.message)

    await logAuditEvent('employees', id, 'UPDATE', oldData, data, user.id)

    return apiSuccess(data)
}
