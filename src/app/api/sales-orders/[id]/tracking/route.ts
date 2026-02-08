import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id: salesOrderId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    try {
        // 1. Fetch Sales Order with its items
        const { data: order, error: orderError } = await supabase
            .from('sales_orders')
            .select(`
        *,
        customer:customers(name),
        items:sales_order_items(*)
      `)
            .eq('id', salesOrderId)
            .single()

        if (orderError || !order) {
            return apiError('Sales Order not found')
        }

        // 2. Fetch all fulfillment data linked to these SO items
        const itemIds = order.items.map((i: any) => i.id)

        const [
            { data: poItems },
            { data: grnItems },
            { data: dispatchItems },
            { data: invoiceItems }
        ] = await Promise.all([
            supabase.from('purchase_order_items').select('*, po:purchase_orders(*)').in('sales_order_item_id', itemIds),
            supabase.from('grn_items').select('*, grn:grn(*)').in('sales_order_item_id', itemIds),
            supabase.from('dispatch_items').select('*, dispatch:dispatches(*)').in('sales_order_item_id', itemIds),
            supabase.from('invoice_items').select('*, invoice:invoices(*)').in('sales_order_item_id', itemIds)
        ])

        // 3. Aggregate into timeline format per item
        const trackingData = order.items.map((item: any) => {
            const itemPo = poItems?.find(p => p.sales_order_item_id === item.id)
            const itemGrn = grnItems?.find(g => g.sales_order_item_id === item.id)
            const itemDispatch = dispatchItems?.find(d => d.sales_order_item_id === item.id)
            const itemInvoice = invoiceItems?.find(i => i.sales_order_item_id === item.id)

            return {
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                uom: item.uom,
                stages: {
                    order_received: {
                        status: 'completed',
                        date: order.order_date,
                        reference: order.order_number
                    },
                    po_sent: itemPo ? {
                        status: 'completed',
                        date: itemPo.po?.created_at,
                        reference: itemPo.po?.po_number,
                        vendor: itemPo.po?.vendor_id, // Could join for name if needed
                        expected_date: itemPo.expected_delivery_date || itemPo.po?.delivery_date
                    } : { status: 'pending' },
                    material_received: itemGrn ? {
                        status: 'completed',
                        date: itemGrn.grn?.received_date,
                        reference: itemGrn.grn?.grn_number,
                        heat_number: itemGrn.heat_number
                    } : { status: 'pending' },
                    qc_completed: itemGrn?.inspection_status ? {
                        status: itemGrn.inspection_status === 'accepted' ? 'completed' :
                            itemGrn.inspection_status === 'rejected' ? 'failed' : 'in_progress',
                        date: itemGrn.updated_at,
                        result: itemGrn.inspection_status
                    } : { status: 'pending' },
                    ready_to_dispatch: (itemGrn?.inspection_status === 'accepted') ? {
                        status: itemDispatch ? 'completed' : 'ready',
                        quantity: itemGrn.received_quantity
                    } : { status: 'pending' },
                    dispatched: itemDispatch ? {
                        status: 'completed',
                        date: itemDispatch.dispatch?.dispatch_date,
                        reference: itemDispatch.dispatch?.dispatch_number,
                        vehicle: itemDispatch.dispatch?.vehicle_number
                    } : { status: 'pending' },
                    invoiced: itemInvoice ? {
                        status: 'completed',
                        date: itemInvoice.invoice?.invoice_date,
                        reference: itemInvoice.invoice?.invoice_number
                    } : { status: 'pending' }
                }
            }
        })

        return apiSuccess({
            order_number: order.order_number,
            customer: order.customer?.name,
            items: trackingData
        })

    } catch (error: any) {
        console.error('Tracking API Error:', error)
        return apiError(error.message)
    }
}
