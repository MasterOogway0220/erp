import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    // REQ-INV-001: Slow-moving stock (>90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const dateStr = ninetyDaysAgo.toISOString()

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select(`
        *,
        product:products(id, name, code)
      `)
            .lt('created_at', dateStr)
            .gt('quantity', 0)
            .order('created_at', { ascending: true })

        if (error) throw error

        return apiSuccess(data)
    } catch (error: any) {
        return apiError(error.message)
    }
}
