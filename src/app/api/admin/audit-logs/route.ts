import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Verify authorization (Admin only check could be added here later)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table_name')
    const recordId = searchParams.get('record_id')
    const userId = searchParams.get('user_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
        .from('audit_logs')
        .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(full_name, email)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (tableName) query = query.eq('table_name', tableName)
    if (recordId) query = query.eq('record_id', recordId)
    if (userId) query = query.eq('user_id', userId)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, count, error } = await query

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess({
        logs: data,
        total: count,
        limit,
        offset
    })
}
