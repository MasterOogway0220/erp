import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
import { createQuotationSchema, isValidStatusTransition } from '@/lib/validations/schemas'

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
    .from('quotations')
    .select(`
      *,
      customer:customers(id, name),
      enquiry:enquiries(id, enquiry_number),
      items:quotation_items(*, product:products(id, name, code))
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
    console.error('Error fetching quotations:', error)
    return apiError(error.message)
  }

  console.log(`Fetched ${data?.length || 0} quotations. Status filter: ${status || 'none'}`)
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
  const validation = createQuotationSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const {
    customer_id, enquiry_id, items, currency, valid_until, validity_days,
    remarks, quotation_type, buyer_id, project_name, terms, parent_quotation_id,
    port_of_loading_id, port_of_discharge_id, vessel_name, testing_standards,
    exchange_rate
  } = validation.data

  // Get User's Company
  const { data: employee } = await supabase
    .from('employees')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  const { data: customer } = await adminClient
    .from('customers')
    .select('id, name')
    .eq('id', customer_id)
    .single()

  if (!customer) {
    return apiError('Customer not found')
  }

  // Handle Revision Logic
  let quotationNumber: string
  let versionNumber = 1

  if (parent_quotation_id) {
    const { data: parent } = await adminClient
      .from('quotations')
      .select('quotation_number, version_number')
      .eq('id', parent_quotation_id)
      .single()

    if (!parent) return apiError('Parent quotation not found')

    quotationNumber = parent.quotation_number
    versionNumber = (parent.version_number || 0) + 1

    // Mark parent as not latest
    await adminClient
      .from('quotations')
      .update({ is_latest_version: false })
      .eq('id', parent_quotation_id)
  } else {
    quotationNumber = await generateDocumentNumber('QTN')
  }

  let subtotal = 0
  const processedItems = items.map(item => {
    const lineTotal = item.quantity * item.unit_price * (1 - (item.discount || 0) / 100)
    subtotal += lineTotal

    return {
      product_id: item.product_id || null,
      product_spec_id: item.product_spec_id || null,
      pipe_size_id: item.pipe_size_id || null,
      product_name: item.product_name,
      description: item.description,
      description_text: item.description, // also save to text field for non-standard
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount || 0,
      line_total: lineTotal,
      uom_id: item.uom_id,
      size: item.size,
      schedule: item.schedule,
      wall_thickness: item.wall_thickness,
      weight_per_mtr: item.weight_per_mtr,
      total_weight: item.total_weight,
      auto_calculated_weight: item.auto_calculated_weight,
      grade: item.grade,
    }
  })

  const taxAmount = subtotal * 0.18
  const totalAmount = subtotal + taxAmount

  const { data: quotation, error: quotationError } = await adminClient
    .from('quotations')
    .insert({
      quotation_number: quotationNumber,
      customer_id,
      buyer_id,
      enquiry_id,
      project_name,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount + (validation.data.packing_charges || 0) + (validation.data.freight_charges || 0) + (validation.data.other_charges || 0),
      currency,
      exchange_rate: exchange_rate || (currency === 'INR' ? 1 : 83),
      valid_until,
      validity_days,
      version_number: versionNumber,
      revision: versionNumber,
      is_latest_version: true,
      quotation_type,
      parent_quotation_id,
      packing_charges: validation.data.packing_charges || 0,
      freight_charges: validation.data.freight_charges || 0,
      other_charges: validation.data.other_charges || 0,
      total_weight: validation.data.total_weight || 0,
      port_of_loading_id,
      port_of_discharge_id,
      vessel_name,
      status: 'draft',
      remarks,
      created_by: user.id,
      company_id: employee?.company_id,
    })
    .select()
    .single()

  if (quotationError) {
    return apiError(quotationError.message)
  }

  // Insert Items
  const { error: itemsError } = await adminClient
    .from('quotation_items')
    .insert(processedItems.map(item => ({
      ...item,
      quotation_id: quotation.id,
    })))

  if (itemsError) {
    await adminClient.from('quotations').delete().eq('id', quotation.id) // Rollback
    return apiError(itemsError.message)
  }

  // Insert Terms
  if (terms && terms.length > 0) {
    const termsToInsert = terms.map(t => ({
      quotation_id: quotation.id,
      terms_id: t.term_id,
      custom_text: t.custom_text,
      display_order: t.display_order
    }))

    const { error: termsError } = await adminClient
      .from('quotation_terms')
      .insert(termsToInsert)

    if (termsError) {
      console.error('Error inserting terms:', termsError)
    }
  }

  // Insert Testing Standards
  if (testing_standards && testing_standards.length > 0) {
    const testingToInsert = testing_standards.map(tid => ({
      quotation_id: quotation.id,
      testing_standard_id: tid
    }))

    const { error: testingError } = await adminClient
      .from('quotation_testing')
      .insert(testingToInsert)

    if (testingError) {
      console.error('Error inserting testing standards:', testingError)
    }
  }

  // Record Pricing History (for items with product_id)
  const historyRecords = items.filter(i => i.product_id).map(i => ({
    product_id: i.product_id,
    quotation_id: quotation.id,
    customer_id: customer_id,
    quoted_price: i.unit_price,
    company_id: employee?.company_id
  }))

  if (historyRecords.length > 0) {
    const { error: historyError } = await adminClient
      .from('product_pricing_history')
      .insert(historyRecords)

    if (historyError) {
      console.error('Error recording pricing history:', historyError)
    }
  }

  if (enquiry_id) {
    await adminClient
      .from('enquiries')
      .update({ status: 'quoted' })
      .eq('id', enquiry_id)
  }

  await logAuditEvent('quotations', quotation.id, 'CREATE', null, quotation, user.id)

  return apiSuccess(quotation, 201)
}
