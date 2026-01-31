import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

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
    const { name, code, address, city, state } = body

    if (!name || !code) {
        return apiError('Missing required fields', 400)
    }

    const { data, error } = await supabase
        .from('warehouses')
        .insert({
            name,
            code,
            address,
            city,
            state,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data, 201)
}
