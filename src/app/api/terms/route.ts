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
    const category = searchParams.get('category')

    let query = supabase
        .from('terms_conditions')
        .select('*')
        .eq('is_active', true)

    if (category) {
        query = query.eq('category', category)
    }

    const { data, error } = await query.order('category', { ascending: true })

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
    const { category, title, default_text } = body

    if (!category || !title || !default_text) {
        return apiError('Missing required fields', 400)
    }

    const { data, error } = await supabase
        .from('terms_conditions')
        .insert({
            category,
            title,
            description: default_text,
            default_text,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data, 201)
}
