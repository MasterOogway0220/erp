
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await adminClient
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code', { ascending: true })

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}
