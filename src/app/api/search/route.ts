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
    const q = searchParams.get('q')

    if (!q || q.length < 2) {
        return apiSuccess([])
    }

    // Search in multiple tables
    // 1. Quotations (by number)
    // 2. Customers (by name)
    // 3. Products (by name/code)
    // 4. Employees (by name/code)
    // 5. Companies (by name)
    // 6. Vendors (by name/code)

    const [quotations, customers, products, employees, companies, vendors] = await Promise.all([
        supabase
            .from('quotations')
            .select('id, quotation_number, status')
            .ilike('quotation_number', `%${q}%`)
            .limit(5),
        supabase
            .from('customers')
            .select('id, name')
            .ilike('name', `%${q}%`)
            .limit(5),
        supabase
            .from('products')
            .select('id, name, internal_material_code')
            .or(`name.ilike.%${q}%,internal_material_code.ilike.%${q}%`)
            .limit(5),
        supabase
            .from('employees')
            .select('id, first_name, last_name, employee_code')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,employee_code.ilike.%${q}%`)
            .limit(5),
        supabase
            .from('companies')
            .select('id, name')
            .ilike('name', `%${q}%`)
            .limit(5),
        supabase
            .from('vendors')
            .select('id, name, vendor_code')
            .or(`name.ilike.%${q}%,vendor_code.ilike.%${q}%`)
            .limit(5)
    ])

    const results = [
        ...(quotations.data || []).map(qt => ({
            id: qt.id,
            title: qt.quotation_number,
            subtitle: `Quotation - ${qt.status}`,
            type: 'quotation',
            href: `/sales/quotations/${qt.id}`
        })),
        ...(customers.data || []).map(c => ({
            id: c.id,
            title: c.name,
            subtitle: 'Customer',
            type: 'customer',
            href: `/masters/customers/${c.id}`
        })),
        ...(products.data || []).map(p => ({
            id: p.id,
            title: p.name,
            subtitle: `Product - ${p.internal_material_code || 'No Code'}`,
            type: 'product',
            href: `/masters/products/${p.id}`
        })),
        ...(employees.data || []).map(e => ({
            id: e.id,
            title: `${e.first_name} ${e.last_name || ''}`,
            subtitle: `Employee - ${e.employee_code || 'No Code'}`,
            type: 'employee',
            href: `/masters/employees/${e.id}`
        })),
        ...(companies.data || []).map(c => ({
            id: c.id,
            title: c.name,
            subtitle: 'Company',
            type: 'company',
            href: `/masters/companies/${c.id}`
        })),
        ...(vendors.data || []).map(v => ({
            id: v.id,
            title: v.name,
            subtitle: `Vendor - ${v.vendor_code || 'No Code'}`,
            type: 'vendor',
            href: `/masters/vendors/${v.id}`
        }))
    ]

    return apiSuccess(results)
}
