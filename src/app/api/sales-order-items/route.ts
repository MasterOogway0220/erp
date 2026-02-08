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
    const soNumber = searchParams.get('so')
    const customerPO = searchParams.get('po')
    const productCode = searchParams.get('product')
    const heatNumber = searchParams.get('heat')

    let query = supabase
        .from('sales_order_items')
        .select(`
      *,
      sales_order:sales_orders(
        id,
        order_number,
        customer_po_number,
        customer:customers(id, name)
      ),
      product:products(id, name, code),
      uom:units_of_measure(id, code, name),
      linked_po:purchase_orders(id, po_number),
      linked_grn:grn(id, grn_number)
    `)
        .order('created_at', { ascending: false })

    if (soNumber) {
        query = query.eq('sales_order.order_number', soNumber)
    }
    if (customerPO) {
        query = query.eq('sales_order.customer_po_number', customerPO)
    }
    if (productCode) {
        query = query.eq('product.code', productCode)
    }
    if (heatNumber) {
        query = query.eq('heat_number', heatNumber)
    }

    const { data, error } = await query

    if (error) {
        return apiError(error.message)
    }

    return apiSuccess(data)
}
