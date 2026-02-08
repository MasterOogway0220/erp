import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    try {
        const body = await request.json()
        const { heat_number, file_url, issuer, issue_date, raw_data, company_id } = body

        if (!heat_number || !file_url) {
            return apiError('Heat Number and File URL are required')
        }

        // 1. Create MTC record
        const { data: mtc, error: mtcError } = await adminClient
            .from('mtc_documents')
            .insert({
                heat_number,
                file_url,
                issuer: issuer || 'Generic Mill',
                issue_date: issue_date || new Date().toISOString().split('T')[0],
                raw_data: raw_data || {},
                company_id,
                uploaded_by: user.id
            })
            .select()
            .single()

        if (mtcError) {
            return apiError(mtcError.message)
        }

        // 2. Link existing inventory items with same heat number to this MTC
        const { error: linkError } = await adminClient
            .from('inventory')
            .update({
                mtc_id: mtc.id,
                mtc_status: 'ACCEPTED' // ISO 7.5.3: Once MTC is uploaded, it's accepted
            })
            .eq('heat_number', heat_number)

        if (linkError) {
            console.error('Failed to link MTC to inventory:', linkError)
        }

        await logAuditEvent('mtc_documents', mtc.id, 'CREATE', null, mtc, user.id)

        return apiSuccess(mtc, 201)

    } catch (error: any) {
        console.error('MTC API Error:', error)
        return apiError(error.message)
    }
}
