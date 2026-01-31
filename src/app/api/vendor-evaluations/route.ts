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
    const vendorId = searchParams.get('vendor_id')

    let query = supabase
        .from('vendor_evaluations')
        .select(`
      *,
      vendor:vendors(id, name),
      evaluator:auth.users(id, email)
    `)
        .order('evaluation_date', { ascending: false })

    if (vendorId) {
        query = query.eq('vendor_id', vendorId)
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
    const { vendor_id, quality_score, delivery_score, pricing_score, communication_score, remarks } = body

    // Validate scores
    const scores = [quality_score, delivery_score, pricing_score, communication_score]
    if (scores.some(s => s < 1 || s > 5)) {
        return apiError('All scores must be between 1 and 5')
    }

    // Calculate overall score (average)
    const overall_score = scores.reduce((a, b) => a + b, 0) / scores.length

    const { data, error } = await supabase
        .from('vendor_evaluations')
        .insert({
            vendor_id,
            quality_score,
            delivery_score,
            pricing_score,
            communication_score,
            overall_score: parseFloat(overall_score.toFixed(2)),
            remarks,
            evaluated_by: user.id,
        })
        .select()
        .single()

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data, 201)
}
