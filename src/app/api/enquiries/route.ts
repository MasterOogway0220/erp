import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createEnquirySchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const customerId = searchParams.get('customer_id')

  let query = supabase
    .from('enquiries')
    .select(`
      *,
      customer:customers(id, name),
      buyer:buyers(id, name, designation, email),
      items:enquiry_items(*, product:products(id, name, code))
    `)
    .order('created_at', { ascending: false })


  if (status) {
    query = query.eq('status', status)
  }
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
  const validation = createEnquirySchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const { customer_id, buyer_id, items, remarks } = validation.data

  const { data: customer } = await adminClient
    .from('customers')
    .select('id, name, is_active')
    .eq('id', customer_id)
    .single()

  if (!customer) {
    return apiError('Customer not found')
  }

  if (customer.is_active === false) {
    return apiError('Cannot create enquiry for inactive customer', 400)
  }

  // Validate buyer if provided (ISO 8.2.1)
  if (buyer_id) {
    const { data: buyer } = await adminClient
      .from('buyers')
      .select('id, customer_id')
      .eq('id', buyer_id)
      .single()

    if (!buyer) {
      return apiError('Buyer not found')
    }

    if (buyer.customer_id !== customer_id) {
      return apiError('Buyer does not belong to selected customer', 400)
    }
  }

  const { data: products } = await adminClient
    .from('products')
    .select('id, name')
    .in('id', items.map(i => i.product_id))

  if (!products || products.length !== items.length) {
    return apiError('One or more products not found')
  }

  const enquiryNumber = await generateDocumentNumber('ENQ')

  const { data: enquiry, error: enquiryError } = await adminClient
    .from('enquiries')
    .insert({
      enquiry_number: enquiryNumber,
      customer_id,
      buyer_id,
      status: 'open',
      remarks,
      created_by: user.id,
    })
    .select()
    .single()

  if (enquiryError) {
    return apiError(enquiryError.message)
  }

  const enquiryItems = items.map(item => ({
    enquiry_id: enquiry.id,
    product_id: item.product_id,
    quantity: item.quantity,
    specifications: item.specifications,
  }))

  const { error: itemsError } = await adminClient
    .from('enquiry_items')
    .insert(enquiryItems)

  if (itemsError) {
    await adminClient.from('enquiries').delete().eq('id', enquiry.id)
    return apiError(itemsError.message)
  }

  await logAuditEvent('enquiries', enquiry.id, 'CREATE', null, enquiry, user.id)

  return apiSuccess(enquiry, 201)
}
