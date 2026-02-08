import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-utils'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    try {
        const { data: items, error } = await supabase
            .from('inventory')
            .select(`
        *,
        product:products(id, name, code, material_grade, standard, hsn_code),
        grn:grn(grn_number),
        warehouse:warehouses(name)
      `)
            .order('created_at', { ascending: false })

        if (error) throw error

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Current Inventory')

        worksheet.columns = [
            { header: 'Heat Number', key: 'heat_number', width: 20 },
            { header: 'Product Name', key: 'product_name', width: 30 },
            { header: 'Material Code', key: 'product_code', width: 25 },
            { header: 'Grade', key: 'material_grade', width: 15 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Reserved', key: 'reserved_quantity', width: 15 },
            { header: 'Available', key: 'available_quantity', width: 15 },
            { header: 'Quality Status', key: 'inspection_status', width: 20 },
            { header: 'Location', key: 'location', width: 20 },
            { header: 'Warehouse', key: 'warehouse', width: 20 },
            { header: 'GRN Ref', key: 'grn', width: 20 },
            { header: 'Received Date', key: 'created_at', width: 20 },
        ]

        items?.forEach(item => {
            worksheet.addRow({
                heat_number: item.heat_number,
                product_name: item.product?.name,
                product_code: item.product?.code,
                material_grade: item.product?.material_grade,
                quantity: item.quantity,
                reserved_quantity: item.reserved_quantity,
                available_quantity: item.available_quantity,
                inspection_status: item.inspection_status.replace('_', ' ').toUpperCase(),
                location: item.location,
                warehouse: item.warehouse?.name,
                grn: item.grn?.grn_number,
                created_at: new Date(item.created_at).toLocaleDateString()
            })
        })

        // Style the header
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        }

        const buffer = await workbook.xlsx.writeBuffer()

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        })

    } catch (error: any) {
        console.error('Export Error:', error)
        return apiError(error.message)
    }
}
