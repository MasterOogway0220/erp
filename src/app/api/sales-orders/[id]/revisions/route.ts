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
        return apiError('Change reason is required for creating an amendment', 400)
    }

    // Fetch parent Sales Order with items
    const { data: parent, error: parentError } = await adminClient
        .from('sales_orders')
        .select(`
      *,
      items:sales_order_items(*)
    `)
        .eq('id', id)
        .single()

    if (parentError || !parent) {
        return apiError('Sales Order not found', 404)
    }

    // Calculate new version number
    const nextVersionNumber = (parent.version_number || 1) + 1

    // Mark parent as not latest
    await adminClient
        .from('sales_orders')
        .update({ is_latest_version: false })
        .eq('id', id)

    // Create new Sales Order (Revision)
    const { data: amendment, error: amendmentError } = await adminClient
        .from('sales_orders')
        .insert({
            company_id: parent.company_id,
            quotation_id: parent.quotation_id,
            customer_id: parent.customer_id,
            buyer_id: parent.buyer_id,
            order_number: parent.order_number,
            order_date: parent.order_date,
            customer_po_number: parent.customer_po_number,
            customer_po_date: parent.customer_po_date,
            status: 'draft',
            currency: parent.currency,
            total_amount: parent.total_amount,
            subtotal: parent.subtotal,
            tax_amount: parent.tax_amount,
            payment_terms: parent.payment_terms,
            delivery_terms: parent.delivery_terms,
            billing_address: parent.billing_address,
            shipping_address: parent.shipping_address,
            remarks: parent.remarks,
            version_number: nextVersionNumber,
            parent_order_id: id,
            is_latest_version: true,
            change_reason: change_reason,
            created_by: user.id
        })
        .select()
        .single()

    if (amendmentError) {
        console.error('Amendment Error:', amendmentError)
        return apiError(amendmentError.message)
    }

    // Copy items
    if (parent.items && parent.items.length > 0) {
        const itemsToInsert = parent.items.map((item: any) => ({
            sales_order_id: amendment.id,
            quotation_item_id: item.quotation_item_id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
            uom: item.uom,
            hsn_code: item.hsn_code,
            metadata: item.metadata,
            status: 'pending' // Reset item status for new revision if appropriate
        }))

        const { error: itemsError } = await adminClient.from('sales_order_items').insert(itemsToInsert)
        if (itemsError) {
            console.error('Items Error:', itemsError)
            return apiError(itemsError.message)
        }
    }

    await logAuditEvent('sales_orders', amendment.id, 'AMENDMENT', parent, amendment, user.id)

    return apiSuccess(amendment, 201)
}
