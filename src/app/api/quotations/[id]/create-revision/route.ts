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

    const body = await request.json()
    const { change_reason } = body

    if (!change_reason) {
        return apiError('Change reason is required for creating a revision', 400)
    }

    // Fetch parent quotation with all details
    const { data: parent, error: parentError } = await adminClient
        .from('quotations')
        .select(`
      *,
      items:quotation_items(*),
      terms:quotation_terms(*),
      testing:quotation_testing(*)
    `)
        .eq('id', id)
        .single()

    if (parentError || !parent) {
        return apiError('Parent quotation not found', 404)
    }

    // Calculate new version number
    const newVersionNumber = (parent.version_number || 0) + 1

    // Mark parent as not latest
    await adminClient
        .from('quotations')
        .update({ is_latest_version: false })
        .eq('id', id)

    // Create new quotation (revision)
    const { data: revision, error: revisionError } = await adminClient
        .from('quotations')
        .insert({
            quotation_number: parent.quotation_number,
            customer_id: parent.customer_id,
            buyer_id: parent.buyer_id,
            enquiry_id: parent.enquiry_id,
            project_name: parent.project_name,
            quotation_type: parent.quotation_type,
            currency: parent.currency,
            exchange_rate: parent.exchange_rate,
            valid_until: parent.valid_until,
            validity_days: parent.validity_days,
            packing_charges: parent.packing_charges,
            freight_charges: parent.freight_charges,
            other_charges: parent.other_charges,
            total_weight: parent.total_weight,
            port_of_loading_id: parent.port_of_loading_id,
            port_of_discharge_id: parent.port_of_discharge_id,
            vessel_name: parent.vessel_name,
            version_number: newVersionNumber,
            revision: newVersionNumber,
            parent_quotation_id: id,
            is_latest_version: true,
            status: 'draft',
            company_id: parent.company_id,
            created_by: user.id
        })
        .select()
        .single()

    if (revisionError) {
        return apiError(revisionError.message)
    }

    // Copy items
    if (parent.items && parent.items.length > 0) {
        const itemsToInsert = parent.items.map((item: any) => ({
            quotation_id: revision.id,
            product_id: item.product_id,
            product_spec_id: item.product_spec_id,
            pipe_size_id: item.pipe_size_id,
            product_name: item.product_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount,
            uom_id: item.uom_id,
            size: item.size,
            schedule: item.schedule,
            wall_thickness: item.wall_thickness,
            weight_per_mtr: item.weight_per_mtr,
            total_weight: item.total_weight,
            auto_calculated_weight: item.auto_calculated_weight,
            grade: item.grade,
            line_total: item.line_total
        }))

        await adminClient.from('quotation_items').insert(itemsToInsert)
    }

    // Copy terms
    if (parent.terms && parent.terms.length > 0) {
        const termsToInsert = parent.terms.map((term: any) => ({
            quotation_id: revision.id,
            terms_id: term.terms_id,
            custom_text: term.custom_text,
            display_order: term.display_order
        }))
        await adminClient.from('quotation_terms').insert(termsToInsert)
    }

    // Copy testing standards
    if (parent.testing && parent.testing.length > 0) {
        const testingToInsert = parent.testing.map((t: any) => ({
            quotation_id: revision.id,
            testing_standard_id: t.testing_standard_id
        }))
        await adminClient.from('quotation_testing').insert(testingToInsert)
    }

    // Create version snapshot
    await adminClient.from('quotation_versions').insert({
        quotation_id: revision.id,
        version_number: newVersionNumber,
        version_label: `Rev.${String(newVersionNumber).padStart(2, '0')}`,
        quotation_data: parent,
        line_items: parent.items,
        terms_conditions: parent.terms,
        changed_by: user.id,
        change_reason,
        is_current: true
    })

    await logAuditEvent('quotations', revision.id, 'CREATE', parent, revision, user.id)

    return apiSuccess(revision, 201)
}
