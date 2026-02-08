import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const {
        quotation_id,
        customer_po_number,
        customer_po_date,
        billing_address,
        shipping_address,
        payment_terms,
        delivery_terms,
        delivery_date,
        remarks
    } = body

    // Validate required fields
    if (!quotation_id || !customer_po_number || !billing_address || !shipping_address) {
        return apiError('Missing required fields: quotation_id, customer_po_number, billing_address, shipping_address', 400)
    }

    // Fetch quotation
    const { data: quotation, error: quotError } = await adminClient
        .from('quotations')
        .select(`
      *,
      items:quotation_items(*)
    `)
        .eq('id', quotation_id)
        .single()

    if (quotError || !quotation) {
        return apiError('Quotation not found', 404)
    }

    if (quotation.status !== 'approved' && quotation.status !== 'sent') {
        return apiError('Quotation must be approved before creating sales order', 400)
    }

    // Get employee's company
    // Use adminClient to bypass RLS
    const { data: employee, error: empError } = await adminClient
        .from('employees')
        .select('company_id, company:companies(name)')
        .eq('user_id', user.id)
        .single()

    console.log('[SO FROM QUOTATION] Employee Lookup Result:', { employee, error: empError });

    // 0. Strict Validation for Mandatory Fields (Fixes NOT NULL constraint violations)
    if (!quotation.customer_id) return apiError('Source quotation is missing customer_id', 400);

    let company_id = employee?.company_id;
    // @ts-ignore
    let company_name = employee?.company?.name || (Array.isArray(employee?.company) ? employee?.company[0]?.name : null);
    let company_code = company_name ? company_name.substring(0, 3).toUpperCase() : null;

    if (!company_id) {
        console.warn('[SO FROM QUOTATION] User has no linked employee record. Attempting fallback.');
        const { data: companies, error: companyError } = await adminClient
            .from('companies')
            .select('id, name')
            .limit(1);

        const defaultCompany = companies?.[0];

        if (defaultCompany) {
            console.log('[SO FROM QUOTATION] Fallback successful. Using company:', defaultCompany.id);
            company_id = defaultCompany.id;
            company_code = defaultCompany.name.substring(0, 3).toUpperCase();
        } else {
            console.error('[SO FROM QUOTATION] Fallback failed:', companyError);
            return apiError('System Configuration Error: No companies defined.', 500);
        }
    }

    company_code = company_code || 'STC';

    // Generate SO number (Optimized)
    const orderNumber = await generateDocumentNumber('SO', company_id, company_code)

    // Calculate total from quotation
    const totalAmount = quotation.total_amount || quotation.items.reduce((sum: number, item: any) => sum + (item.line_total || 0), 0)

    // Create sales order
    const { data: salesOrder, error: soError } = await adminClient
        .from('sales_orders')
        .insert({
            order_number: orderNumber,
            quotation_id,
            customer_id: quotation.customer_id || null,
            buyer_id: quotation.buyer_id || null,
            customer_po_number,
            customer_po_date: customer_po_date || new Date().toISOString().split('T')[0],
            billing_address,
            shipping_address,
            payment_terms: payment_terms || quotation.payment_terms,
            delivery_terms: delivery_terms || quotation.delivery_terms,
            delivery_date: delivery_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
            currency: quotation.currency,
            total_amount: totalAmount,
            status: 'open',
            remarks,
            created_by: user.id,
            company_id
        })
        .select()
        .single()

    if (soError) {
        return apiError(soError.message)
    }

    // Copy items from quotation
    const soItems = quotation.items.map((item: any) => ({
        sales_order_id: salesOrder.id,
        // quotation_item_id: item.id, // Column missing in DB
        product_id: item.product_id || null,
        product_spec_id: item.product_spec_id || null,
        pipe_size_id: item.pipe_size_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total_amount: item.line_total,
        uom: item.uom_id || null,
        hsn_code: item.hsn_code,
        status: 'pending',
        metadata: {
            size: item.size,
            schedule: item.schedule,
            grade: item.grade,
            weight_per_mtr: item.weight_per_mtr,
            total_weight: item.total_weight
        }
    }))

    const { error: itemsError } = await adminClient
        .from('sales_order_items')
        .insert(soItems)

    if (itemsError) {
        // Rollback - delete the sales order
        await adminClient.from('sales_orders').delete().eq('id', salesOrder.id)
        return apiError(itemsError.message)
    }

    // Update quotation status
    // Parallelize updates and logging
    const updates = [
        adminClient.from('quotations').update({ status: 'accepted' }).eq('id', quotation_id),
        logAuditEvent('sales_orders', salesOrder.id, 'CREATE', null, salesOrder, user.id)
    ]

    if (quotation.enquiry_id) {
        updates.push(
            adminClient.from('enquiries').update({ status: 'closed' }).eq('id', quotation.enquiry_id)
        )
    }

    await Promise.all(updates)

    return apiSuccess(salesOrder, 201)
}
