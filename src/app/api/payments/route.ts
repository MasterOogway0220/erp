import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createPaymentSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('invoice_id')
  
  let query = supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices(id, invoice_number, customer:customers(id, name))
    `)
    .order('created_at', { ascending: false })
  
  if (invoiceId) {
    query = query.eq('invoice_id', invoiceId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return apiError(error.message)
  }
  
  return apiSuccess(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const body = await request.json()
  const validation = createPaymentSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { invoice_id, amount, payment_mode, reference_number, payment_date } = validation.data
  
  const { data: invoice, error: invoiceError } = await adminClient
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name)
    `)
    .eq('id', invoice_id)
    .single()
  
  if (invoiceError || !invoice) {
    return apiError('Invoice not found')
  }
  
  if (invoice.status !== 'sent' && invoice.status !== 'partial_paid' && invoice.status !== 'overdue') {
    return apiError('Payment can only be recorded for sent, partially paid, or overdue invoices', 400)
  }
  
  const outstanding = invoice.total - invoice.paid_amount
  
  if (amount > outstanding) {
    return apiError(`Payment amount (${amount}) exceeds outstanding balance (${outstanding})`, 400)
  }
  
  if (payment_mode !== 'cash' && !reference_number) {
    return apiError('Reference number is required for non-cash payments', 400)
  }
  
  const receiptNumber = await generateDocumentNumber('RCP')
  
  const { data: payment, error: paymentError } = await adminClient
    .from('payments')
    .insert({
      receipt_number: receiptNumber,
      invoice_id,
      amount,
      payment_mode,
      reference_number,
      payment_date,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (paymentError) {
    return apiError(paymentError.message)
  }
  
  const newPaidAmount = invoice.paid_amount + amount
  const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'partial_paid'
  
  await adminClient
    .from('invoices')
    .update({ 
      paid_amount: newPaidAmount,
      status: newStatus 
    })
    .eq('id', invoice_id)
  
  if (invoice.customer_id) {
    const { data: customer } = await adminClient
      .from('customers')
      .select('current_outstanding')
      .eq('id', invoice.customer_id)
      .single()
    
    if (customer) {
      const newOutstanding = Math.max(0, (customer.current_outstanding || 0) - amount)
      await adminClient
        .from('customers')
        .update({ current_outstanding: newOutstanding })
        .eq('id', invoice.customer_id)
    }
  }
  
  await logAuditEvent('payments', payment.id, 'CREATE', null, payment, user.id)
  await logAuditEvent('invoices', invoice_id, 'STATUS_CHANGE', 
    { status: invoice.status, paid_amount: invoice.paid_amount },
    { status: newStatus, paid_amount: newPaidAmount },
    user.id
  )
  
  return apiSuccess(payment, 201)
}
