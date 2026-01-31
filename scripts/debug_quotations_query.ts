
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debugQuotations() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching quotations...')
    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            customer:customers(id, name),
            enquiry:enquiries(id, enquiry_number),
            items:quotation_items(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error:', error)
    } else {
        console.log(`Found ${data.length} quotations`)
        if (data.length > 0) {
            console.log('First quotation status:', data[0].status)
            console.log('First quotation customer:', data[0].customer)
        }

        const approved = data.filter((q: any) => q.status === 'approved' || q.status === 'sent')
        console.log(`Approved/Sent count: ${approved.length}`)
    }
}

debugQuotations().catch(console.error)
