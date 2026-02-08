
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, apiPaginatedSuccess, generateDocumentNumber } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');
  const status = searchParams.get('status');

  // Pagination & Sorting Params
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Base query
  let query = supabase
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

    // specific logic to get company_id from employee
    const { data: employee } = await supabase
      .from('employees')
      .select('company_id, company:companies(code)')
      .eq('user_id', user.id)
      .single();

    if (!employee?.company_id) {
      return apiError('No company context found for user. Please ensure employee record is set up.', 400);
    }
    const company_id = employee.company_id;
    // @ts-ignore
    const company_code = employee.company?.code || 'STC';

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
    const adminClient = createAdminClient();
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
          quotation_item_id: item.quotation_item_id || null, // Link if converted
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
