
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, generateDocumentNumber } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');
  const status = searchParams.get('status');

  // Base query
  let query = supabase
    .from('sales_orders')
    .select('*, customer:customers(name), buyer:buyers(name), items:sales_order_items(*)')
    .order('created_at', { ascending: false });

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
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
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    // Fallback if employee not found (e.g. admin/dev), usually strict
    const company_id = employee?.company_id || "c4a7e946-5e58-45f8-b40b-74116c944111"; // Default/Fallback

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

    // 1. Generate SO Number
    const orderNumber = await generateDocumentNumber('SO', company_id);

    // 2. Create Sales Order Header
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        company_id,
        customer_id,
        buyer_id,
        quotation_id,
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
      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(items.map((item: any) => ({
          sales_order_id: order.id,
          quotation_item_id: item.quotation_item_id || null, // Link if converted
          product_id: item.product_id,
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
      await supabase.from('quotations').update({ status: 'converted' }).eq('id', quotation_id);
    }

    return apiSuccess(order, 201);

  } catch (error: any) {
    console.error('API Error:', error);
    return apiError(error.message || 'Internal Server Error', 500);
  }
}
