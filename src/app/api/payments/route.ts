import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createPaymentReceiptSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')

  let query = supabase
    .from('payment_receipts')
    .select(`
      *,
      customer:customers(id, name),
      allocations:payment_receipt_items(
        *,
        invoice:invoices(id, invoice_number)
      )
    `)
    .order('created_at', { ascending: false })

  if (customerId) {
    query = query.eq('customer_id', customerId)
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
  const validation = createPaymentReceiptSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const {
    customer_id,
    amount,
    payment_mode,
    reference_number,
    receipt_date,
    bank_details,
    remarks,
    allocations
  } = validation.data

  // Fetch company_id for the user (assuming single company context for now or fetching from first customer record/context)
  // In a real multi-tenant app, this would be in the session/context.
  // We'll fetch the company_id from the customer for consistency.
  const { data: customer } = await adminClient
    .from('customers')
    .select('company_id')
    .eq('id', customer_id)
    .single()

  if (!customer) {
    return apiError('Customer not found')
  }

  const receiptNumber = await generateDocumentNumber('RCPT', customer.company_id)

  const { data: receipt, error: receiptError } = await adminClient
    .from('payment_receipts')
    .insert({
      company_id: customer.company_id,
      customer_id,
      receipt_number: receiptNumber,
      receipt_date,
      amount,
      payment_mode,
      reference_number,
      bank_details,
      remarks,
      created_by: user.id,
    })
    .select()
    .single()

  if (receiptError) {
    return apiError(receiptError.message)
  }

  if (allocations && allocations.length > 0) {
    const allocationItems = allocations.map(a => ({
      company_id: customer.company_id,
      receipt_id: receipt.id,
      invoice_id: a.invoice_id,
      amount: a.amount
    }))

    const { error: allocationError } = await adminClient
      .from('payment_receipt_items')
      .insert(allocationItems)

    if (allocationError) {
      // rollback (manual in this simple setup)
      await adminClient.from('payment_receipts').delete().eq('id', receipt.id)
      return apiError(allocationError.message)
    }

    // Process each allocation: decrement outstanding and update invoice status
    for (const allocation of allocations) {
      await adminClient.rpc('decrement_customer_outstanding', {
        p_customer_id: customer_id,
        p_amount: allocation.amount
      })

      await adminClient.rpc('process_invoice_payment', {
        p_invoice_id: allocation.invoice_id,
        p_payment_amount: allocation.amount
      })
    }
  } else {
    // If no allocations, just decrement customer outstanding (unallocated payment)
    await adminClient.rpc('decrement_customer_outstanding', {
      p_customer_id: customer_id,
      p_amount: amount
    })
  }

  await logAuditEvent('payment_receipts', receipt.id, 'CREATE', null, receipt, user.id)

  return apiSuccess(receipt, 201)
}
