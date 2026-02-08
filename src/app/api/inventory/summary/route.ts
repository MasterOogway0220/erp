import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    try {
        // 1. Total Stock and Reserved Stock
        const { data: totals, error: totalsError } = await supabase
            .from('inventory')
            .select('quantity, reserved_quantity, inspection_status')

        if (totalsError) throw totalsError

        const summary = {
            totalQuantity: 0,
            totalReserved: 0,
            totalAvailable: 0,
            qualityStatus: {
                under_inspection: 0,
                accepted: 0,
                rejected: 0
            },
            lowStockItems: 0
        }

        totals?.forEach(item => {
            summary.totalQuantity += Number(item.quantity) || 0
            summary.totalReserved += Number(item.reserved_quantity) || 0

            const status = item.inspection_status as keyof typeof summary.qualityStatus
            if (summary.qualityStatus[status] !== undefined) {
                summary.qualityStatus[status] += Number(item.quantity) || 0
            }
        })

        summary.totalAvailable = summary.totalQuantity - summary.totalReserved

        // 2. Low Stock Alert Count
        const { data: lowStock, error: lowStockError } = await supabase
            .from('products')
            .select('id, min_stock_level')
            .gt('min_stock_level', 0)

        if (lowStockError) throw lowStockError

        // We need to compare with actual inventory levels
        // For simplicity, we can do this in the app logic or a complex query
        // Let's do a simple count for now by fetching all stock per product
        const { data: stockPerProduct } = await supabase
            .from('inventory')
            .select('product_id, quantity')

        const productStock: Record<string, number> = {}
        stockPerProduct?.forEach(s => {
            productStock[s.product_id] = (productStock[s.product_id] || 0) + Number(s.quantity)
        })

        lowStock?.forEach(p => {
            if ((productStock[p.id] || 0) < Number(p.min_stock_level)) {
                summary.lowStockItems++
            }
        })

        return apiSuccess(summary)

    } catch (error: any) {
        console.error('Inventory Summary Error:', error)
        return apiError(error.message)
    }
}
