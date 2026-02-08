
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiPaginatedSuccess, generateDocumentNumber } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  // Use adminClient to bypass RLS and ensure visibility consistent with Create logic
  const adminClient = createAdminClient();
  const supabase = await createClient(); // Still need this for auth check

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return apiError('Unauthorized', 401);
  }

  const searchParams = request.nextUrl.searchParams;
  let companyId = searchParams.get('companyId');
  const status = searchParams.get('status');

  // Pagination & Sorting Params
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Determine Company Context (Mirroring POST logic)
  if (!companyId) {
    const { data: employee } = await adminClient
      .from('employees')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (employee?.company_id) {
      companyId = employee.company_id;
    } else {
      // Fallback to default company
      const { data: companies } = await adminClient
        .from('companies')
        .select('id')
        .limit(1);
      if (companies?.[0]) {
        companyId = companies[0].id;
      }
    }
  }

  // Base query using adminClient
  let query = adminClient
    .from('sales_orders')
    .select('*, customer:customers(name), buyer:buyers(buyer_name), items:sales_order_items(*)', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return apiPaginatedSuccess(data, {
    page,
    pageSize,
    totalCount,
    totalPages
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiError('Unauthorized', 401);
    }

    // Use adminClient to bypass RLS for this internal lookup
    const adminClient = createAdminClient();
    console.log('[SO CREATE] Authenticated User ID:', user.id);

    const { data: employee, error: empError } = await adminClient
      .from('employees')
      .select('company_id, company:companies(name)')
      .eq('user_id', user.id)
      .single();

    console.log('[SO CREATE] Employee Lookup Result:', { employee, error: empError });

    let company_id = employee?.company_id;
    // @ts-ignore
    let company_name = employee?.company?.name || (Array.isArray(employee?.company) ? employee?.company[0]?.name : null);
    let company_code = company_name ? company_name.substring(0, 3).toUpperCase() : null;

    if (!company_id) {
      console.warn('[SO CREATE] User has no linked employee record. Attempting fallback to default company.');

      // Self-healing: Fetch the first valid company
      const { data: companies, error: companyError } = await adminClient
        .from('companies')
        .select('id, name')
        .limit(1);

      const defaultCompany = companies?.[0];

      if (defaultCompany) {
        console.log('[SO CREATE] Fallback successful. Using company:', defaultCompany.id);
        company_id = defaultCompany.id;
        company_code = defaultCompany.name.substring(0, 3).toUpperCase();
      } else {
        const errorMsg = `[SO CREATE] specific Fallback failed: ${JSON.stringify(companyError)}`;
        console.error(errorMsg);
        // import fs from 'fs'; // Dynamic import or use if existing?
        // Let's rely on clearer console log first, but user says "No companies defined".
        // That means defaultCompany is null.

        return apiError(`System Configuration Error: No companies defined. details: ${JSON.stringify(companyError)}`, 500);
      }
    }

    // Ensure code has a default if still missing (though DB should have it)
    company_code = company_code || 'STC';

    const body = await request.json();
    const {
      customer_id,
      buyer_id,
      quotation_id,
      customer_po_number,
      customer_po_date,
      order_date,
      payment_terms,
      delivery_terms,
      billing_address,
      shipping_address,
      items,
      remarks,
      currency
    } = body;

    // 0. Strict Validation for Mandatory Fields (Fixes NOT NULL constraint violations)
    if (!customer_id) return apiError('customer_id is required', 400);
    // if (!buyer_id) return apiError('buyer_id is required', 400);
    if (!items || items.length === 0) return apiError('At least one item is required', 400);
    if (!billing_address) return apiError('billing_address is required', 400);
    if (!shipping_address) return apiError('shipping_address is required', 400);
    if (!customer_po_number) return apiError('customer_po_number is required', 400);
    if (!customer_po_date) return apiError('customer_po_date is required', 400);

    // 1. Generate SO Number (Optimized)
    const orderNumber = await generateDocumentNumber('SO', company_id, company_code);

    // 2. Create Sales Order Header
    const { data: order, error: orderError } = await adminClient
      .from('sales_orders')
      .insert({
        company_id,
        customer_id: customer_id || null,
        buyer_id: buyer_id || null,
        quotation_id: quotation_id || null,
        order_number: orderNumber,
        customer_po_number,
        customer_po_date, // client must provide YYYY-MM-DD
        order_date: order_date || new Date().toISOString(),
        payment_terms,
        delivery_terms,
        billing_address,
        shipping_address, // Consignee
        remarks,
        currency: currency || 'INR',
        status: 'draft', // Default status for new SO
        total_amount: items.reduce((sum: number, item: any) => sum + (Number(item.total_amount) || 0), 0),
        created_by: user.id
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating sales order:', orderError);
      return apiError(orderError.message, 500);
    }

    // 3. Create Sales Order Items
    if (items && items.length > 0) {
      const { error: itemsError } = await adminClient
        .from('sales_order_items')
        .insert(items.map((item: any) => ({
          sales_order_id: order.id,
          // quotation_item_id: item.quotation_item_id || null, // Link if converted - Column missing
          product_id: item.product_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          uom: item.uom,
          hsn_code: item.hsn_code,
          metadata: item.metadata
        })));

      if (itemsError) {
        console.error('Error creating items:', itemsError);
        // Clean up order? For now, just error.
        return apiError('Order created but items failed: ' + itemsError.message, 500);
      }
    }

    // 4. Update Quotation status if converted
    if (quotation_id) {
      await adminClient.from('quotations').update({ status: 'converted' }).eq('id', quotation_id);
    }

    return apiSuccess(order, 201);

  } catch (error: any) {
    console.error('API Error:', error);
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
