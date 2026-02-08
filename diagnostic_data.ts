import { createAdminClient } from './src/lib/supabase/admin'

async function diagnostic() {
    const supabase = createAdminClient()

    // 1. Check current company mapping for a sample user (or just overall distribution)
    const { data: employees } = await supabase.from('employees').select('user_id, company_id').limit(10)
    console.log('Sample Employees:', employees)

    // 2. Check Customer company distribution
    const { data: custDist } = await supabase.from('customers').select('id, company_id').limit(10)
    console.log('Sample Customers:', custDist)

    // 3. Check a sample quotation
    const { data: quotation } = await supabase.from('quotations').select('id, customer_id, company_id').limit(1)
    console.log('Sample Quotation:', quotation)
}

diagnostic()
