import { createAdminClient } from './src/lib/supabase/admin'

async function checkCustomers() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('customers').select('id, name')

    if (error) {
        console.error('Error fetching customers:', error)
        return
    }

    console.log('Customers found:', data?.length)
    if (data && data.length > 0) {
        console.log('First customer:', data[0])
    } else {
        console.log('No customers found in database.')
    }
}

checkCustomers()
