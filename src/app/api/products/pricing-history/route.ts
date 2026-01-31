import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const customerId = searchParams.get('customer_id')

    if (!productId) {
        return apiError('Product ID is required', 400)
    }

    let query = supabase
        .from('product_pricing_history')
        .select(`
      *,
      customer:customers(name),
      quotation:quotations(quotation_number, status)
    `)
        .eq('product_id', productId)
        .order('quoted_date', { ascending: false })

    if (customerId) {
        query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}
