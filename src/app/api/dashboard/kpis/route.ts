import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Enquiry to Quotation Conversion
        const { count: enquiriesCount } = await supabase
            .from('enquiries')
            .select('*', { count: 'exact', head: true })

        const { count: quotesFromEnquiriesCount } = await supabase
            .from('quotations')
            .select('*', { count: 'exact', head: true })
            .not('enquiry_id', 'is', null)

        const enquiryConversion = enquiriesCount ? (quotesFromEnquiriesCount || 0) / enquiriesCount * 100 : 0

        // 2. Quotation Success Rate
        const { count: totalQuotes } = await supabase
            .from('quotations')
            .select('*', { count: 'exact', head: true })

        const { count: successfulQuotes } = await supabase
            .from('sales_orders')
            .select('*', { count: 'exact', head: true })

        const quotationSuccess = totalQuotes ? (successfulQuotes || 0) / totalQuotes * 100 : 0

        // 3. Inventory Valuation
        const { data: inventoryData } = await supabase
            .from('inventory')
            .select('quantity, product:products(base_price, category)')

        const inventoryValuation = (inventoryData || []).reduce((acc: any, item: any) => {
            const category = item.product?.category || 'Uncategorized'
            const value = (item.quantity || 0) * (item.product?.base_price || 0)
            acc[category] = (acc[category] || 0) + value
            return acc
        }, {})

        // Convert to array for bar chart
        const inventoryValuationArray = Object.entries(inventoryValuation).map(([name, value]) => ({ name, value }))

        // 4. QC Performance (Average Inspection Time)
        const { data: qcData } = await supabase
            .from('inspections')
            .select('created_at, grn:grn(created_at)')
            .not('grn_id', 'is', null)

        const avgInspectionTime = (qcData || []).reduce((sum: number, item: any) => {
            const inspectionDate = new Date(item.created_at)
            const grnDate = new Date(item.grn.created_at)
            const diffDays = (inspectionDate.getTime() - grnDate.getTime()) / (1000 * 3600 * 24)
            return sum + diffDays
        }, 0) / (qcData?.length || 1)

        // 5. Payment Ageing
        const { data: unpaidInvoices } = await supabase
            .from('invoices')
            .select('total, paid_amount, due_date')
            .neq('status', 'paid')

        const today = new Date()
        const ageing = {
            '0-30 days': 0,
            '31-60 days': 0,
            '61-90 days': 0,
            '90+ days': 0
        }

        unpaidInvoices?.forEach((inv: any) => {
            const dueDate = new Date(inv.due_date)
            const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
            const balance = inv.total - (inv.paid_amount || 0)

            if (diffDays <= 30) ageing['0-30 days'] += balance
            else if (diffDays <= 60) ageing['31-60 days'] += balance
            else if (diffDays <= 90) ageing['61-90 days'] += balance
            else ageing['90+ days'] += balance
        })

        const ageingArray = Object.entries(ageing).map(([name, value]) => ({ name, value }))

        return NextResponse.json({
            data: {
                enquiryConversion,
                quotationSuccess,
                inventoryValuation: inventoryValuationArray,
                qcPerformance: [
                    { name: 'Last 7 Days', value: avgInspectionTime }, // Simplified for initial version
                ],
                paymentAgeing: ageingArray
            }
        })

    } catch (error) {
        console.error('Error fetching dashboard KPIs:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
