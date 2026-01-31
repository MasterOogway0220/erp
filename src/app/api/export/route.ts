import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(type || 'Data')

    if (type === 'inventory') {
        const { data: inventory } = await supabase
            .from('inventory')
            .select('*, product:products(name, code), warehouse:warehouses(name), grn:grn(grn_number)')
            .order('created_at', { ascending: false })

        worksheet.columns = [
            { header: 'Product Name', key: 'product_name', width: 30 },
            { header: 'Product Code', key: 'product_code', width: 15 },
            { header: 'Heat Number', key: 'heat_number', width: 20 },
            { header: 'Warehouse', key: 'warehouse', width: 20 },
            { header: 'Location', key: 'location', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Available', key: 'available', width: 10 },
            { header: 'Reserved', key: 'reserved', width: 10 },
            { header: 'Inspection Status', key: 'status', width: 15 },
            { header: 'GRN Number', key: 'grn', width: 20 },
        ]

        inventory?.forEach(item => {
            worksheet.addRow({
                product_name: item.product?.name,
                product_code: item.product?.code,
                heat_number: item.heat_number,
                warehouse: item.warehouse?.name || 'Main Warehouse',
                location: item.location,
                quantity: item.quantity,
                available: item.available_quantity,
                reserved: item.reserved_quantity,
                status: item.inspection_status,
                grn: item.grn?.grn_number
            })
        })
    } else if (type === 'customers') {
        const { data: customers } = await supabase.from('customers').select('*').order('name')
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'GSTIN', key: 'gstin', width: 20 },
            { header: 'Address', key: 'address', width: 40 },
        ]
        customers?.forEach(c => worksheet.addRow(c))
    } else if (type === 'vendors') {
        const { data: vendors } = await supabase.from('vendors').select('*').order('name')
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'GSTIN', key: 'gstin', width: 20 },
            { header: 'Address', key: 'address', width: 40 },
        ]
        vendors?.forEach(v => worksheet.addRow(v))
    } else {
        return new NextResponse('Invalid export type', { status: 400 })
    }

    // Styling
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`
        }
    })
}
