import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    // 1. Fetch current quotation to get the quotation_number
    const { data: q, error: fetchError } = await adminClient
        .from('quotations')
        .select('quotation_number')
        .eq('id', id)
        .single()

    if (fetchError || !q) {
        return apiError('Quotation not found', 404)
    }

    // 2. Fetch all quotations with the same number
    const { data: history, error: historyError } = await adminClient
        .from('quotations')
        .select(`
      *,
      items:quotation_items(*),
      customer:customers(name),
      creator:profiles(full_name)
    `)
        .eq('quotation_number', q.quotation_number)
        .order('revision', { ascending: false })

    if (historyError) {
        return apiError(historyError.message)
    }

    return apiSuccess(history)
}
