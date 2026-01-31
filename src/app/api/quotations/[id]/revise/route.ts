import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'

export async function POST(
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

    // 1. Fetch original quotation
    const { data: q, error: fetchError } = await adminClient
        .from('quotations')
        .select(`
      *,
      items:quotation_items(*)
    `)
        .eq('id', id)
        .single()

    if (fetchError || !q) {
        return apiError('Quotation not found', 404)
    }

    // 2. Create new revision
    const newRevisionNumber = (q.revision || 1) + 1

    const { data: newQuotation, error: createError } = await adminClient
        .from('quotations')
        .insert({
            quotation_number: q.quotation_number,
            customer_id: q.customer_id,
            enquiry_id: q.enquiry_id,
            subtotal: q.subtotal,
            tax: q.tax,
            total: q.total,
            currency: q.currency,
            exchange_rate: q.exchange_rate,
            valid_until: q.valid_until,
            revision: newRevisionNumber,
            status: 'draft',
            remarks: `Revision of ${q.quotation_number}-Rev${q.revision}`,
            created_by: user.id,
            quotation_type: q.quotation_type,
            incoterms: q.incoterms,
            port_of_loading: q.port_of_loading,
            port_of_destination: q.port_of_destination,
            country_of_destination: q.country_of_destination,
            payment_terms: q.payment_terms,
            delivery_period: q.delivery_period,
            packing_charges: q.packing_charges,
            freight_charges: q.freight_charges,
            insurance_charges: q.insurance_charges,
            documentation_charges: q.documentation_charges,
            loading_charges: q.loading_charges,
            terms_and_conditions: q.terms_and_conditions
        })
        .select()
        .single()

    if (createError) {
        return apiError(createError.message)
    }

    // 3. Clone items
    if (q.items && q.items.length > 0) {
        const newItems = q.items.map((item: any) => ({
            quotation_id: newQuotation.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            total: item.total,
            size: item.size,
            grade: item.grade,
            unit: item.unit,
            description: item.description
        }))

        const { error: itemsError } = await adminClient
            .from('quotation_items')
            .insert(newItems)

        if (itemsError) {
            await adminClient.from('quotations').delete().eq('id', newQuotation.id)
            return apiError(itemsError.message)
        }
    }

    // 4. Update old quotation status (optional but recommended to mark as superseded)
    await adminClient
        .from('quotations')
        .update({ status: 'expired' }) // Or a new status like 'superseded'
        .eq('id', id)

    await logAuditEvent('quotations', newQuotation.id, 'REVISION', { originalId: id }, newQuotation, user.id)

    return apiSuccess(newQuotation, 201)
}
