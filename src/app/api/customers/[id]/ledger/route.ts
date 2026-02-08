import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return apiError('Unauthorized', 401)
    }

    // Fetch customer details for opening balance
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, opening_balance, opening_balance_date')
        .eq('id', id)
        .single()

    if (customerError || !customer) {
        return apiError('Customer not found')
    }

    // Fetch all invoices
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, total_amount, status')
        .eq('customer_id', id)
        .order('invoice_date', { ascending: true })

    // Fetch all payments
    const { data: payments, error: payError } = await supabase
        .from('payment_receipts')
        .select('id, receipt_number, receipt_date, amount, payment_mode')
        .eq('customer_id', id)
        .order('receipt_date', { ascending: true })

    if (invError || payError) {
        return apiError('Failed to fetch ledger data')
    }

    // Combine and sort
    const ledger = [
        // Opening Balance entry
        {
            id: 'opening',
            date: customer.opening_balance_date || '2000-01-01',
            description: 'Opening Balance',
            reference: '',
            type: 'balance',
            debit: customer.opening_balance > 0 ? customer.opening_balance : 0,
            credit: customer.opening_balance < 0 ? Math.abs(customer.opening_balance) : 0,
        },
        ...invoices.map(inv => ({
            id: inv.id,
            date: inv.invoice_date,
            description: `Invoice ${inv.invoice_number}`,
            reference: inv.invoice_number,
            type: 'invoice',
            debit: inv.total_amount,
            credit: 0,
            status: inv.status
        })),
        ...payments.map(pay => ({
            id: pay.id,
            date: pay.receipt_date,
            description: `Payment Receipt ${pay.receipt_number}`,
            reference: pay.receipt_number,
            type: 'payment',
            debit: 0,
            credit: pay.amount,
            mode: pay.payment_mode
        }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate Running Balance
    let runningBalance = 0
    const ledgerWithBalance = ledger.map(entry => {
        runningBalance += (entry.debit - entry.credit)
        return { ...entry, balance: runningBalance }
    })

    return apiSuccess({
        customer,
        ledger: ledgerWithBalance
    })
}
