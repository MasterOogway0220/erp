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
    const product = searchParams.get('product')

    let query = supabase
        .from('product_specifications')
        .select('*')
        .order('product_name', { ascending: true })

    if (product) {
        query = query.ilike('product_name', `%${product}%`)
    }

    const { data, error } = await query

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items)) {
        return apiError('Invalid request body, expected an array of items')
    }

    const { data, error } = await supabase
        .from('product_specifications')
        .insert(items)
        .select()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}
