import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    try {
        // 1. Get Stock by Category & Total Value
        const { data: stockData, error: stockError } = await supabase
            .from('inventory')
            .select(`
                quantity,
                product:products (
                    id,
                    name,
                    category,
                    base_price,
                    unit
                )
            `)

        if (stockError) throw stockError

        const categoryStats: Record<string, { category: string; total_value: number; count: number }> = {}
        let totalValue = 0

        stockData?.forEach((item: any) => {
            const product = item.product
            const value = (item.quantity || 0) * (product?.base_price || 0)
            const cat = product?.category || 'Other'

            if (!categoryStats[cat]) {
                categoryStats[cat] = { category: cat, total_value: 0, count: 0 }
            }

            categoryStats[cat].total_value += value
            categoryStats[cat].count += item.quantity
            totalValue += value
        })

        // 2. Low Stock Items (Stock < 10 units for demo)
        const lowStockItems = stockData
            ?.filter((item: any) => item.quantity < 10)
            ?.map((item: any) => ({
                id: item.product?.id,
                name: item.product?.name,
                stock: item.quantity,
                unit: item.product?.unit
            }))
            .slice(0, 5)

        // 3. Slow Moving Items (Last moved > 90 days ago)
        // For now, we'll simulate this or use 'updated_at' as a proxy if transactions aren't easy to join
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const { data: slowMovingData } = await supabase
            .from('inventory')
            .select(`
                id,
                quantity,
                updated_at,
                product:products (id, name, base_price)
            `)
            .lt('updated_at', ninetyDaysAgo.toISOString())
            .gt('quantity', 0)
            .order('updated_at', { ascending: true })
            .limit(5)

        const slowMovingItems = slowMovingData?.map((item: any) => ({
            id: item.product?.id,
            name: item.product?.name,
            last_moved: item.updated_at,
            days_idle: Math.floor((new Date().getTime() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
            value: item.quantity * (item.product?.base_price || 0)
        }))

        return apiSuccess({
            total_value: totalValue,
            stock_by_category: Object.values(categoryStats),
            low_stock_items: lowStockItems || [],
            slow_moving_items: slowMovingItems || []
        })

    } catch (err: any) {
        return apiError(err.message)
    }
}
