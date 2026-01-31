import { createClient } from '@/lib/supabase/server'

/**
 * Fetches default terms and conditions for a customer.
 */
export async function getCustomerDefaultTerms(customerId: string) {
    const supabase = await createClient()

    // Get customer's default terms ID
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('default_terms_id')
        .eq('id', customerId)
        .single()

    if (customerError || !customer?.default_terms_id) {
        return null
    }

    // Get the actual term details
    const { data: term, error: termError } = await supabase
        .from('terms_conditions')
        .select('*')
        .eq('id', customer.default_terms_id)
        .single()

    if (termError) {
        return null
    }

    return term
}
