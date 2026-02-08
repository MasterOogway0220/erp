import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
        .from('payment_receipts')
        .select(`
      *,
      customer:customers(*),
      allocations:payment_receipt_items(
        *,
        invoice:invoices(*)
      )
    `)
        .eq('id', params.id)
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}
