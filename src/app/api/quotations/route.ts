import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, apiPaginatedSuccess, generateDocumentNumber, logAuditEvent } from '@/lib/api-utils'
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

  // Pagination & Sorting Params
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('quotations')
    .select(`
      *,
      customer:customers(id, name),
      enquiry:enquiries(id, enquiry_number),
      items:quotation_items(*, product:products(id, name, code))
    `, { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }
  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching quotations:', error)
    return apiError(error.message)
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return apiPaginatedSuccess(data, {
    page,
    pageSize,
    totalCount,
    totalPages
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const body = await request.json()

  // Derivation logic: If valid_until is missing, calculate it from validity_days
  if (!body.valid_until && body.validity_days) {
    const d = new Date()
    d.setDate(d.getDate() + body.validity_days)
    body.valid_until = d.toISOString().split('T')[0]
  } else if (!body.valid_until && !body.validity_days) {
    // Default to 15 days if both are missing
    const d = new Date()
    d.setDate(d.getDate() + 15)
    body.valid_until = d.toISOString().split('T')[0]
    body.validity_days = 15
  }

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
    quotationNumber = await generateDocumentNumber('QTN', employee?.company_id)
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
      uom_id: item.uom_id || null,
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
      version_number: 0, // Initial version is 0 for Rev.00
      revision: 0,
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
      status: validation.data.status || 'draft',
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
  let insertedTerms = [];
  if (terms && terms.length > 0) {
    const termsToInsert = terms.map(t => ({
      quotation_id: quotation.id,
      terms_id: t.term_id,
      custom_text: t.custom_text,
      display_order: t.display_order
    }))

    const { data: insertedData, error: termsError } = await adminClient
      .from('quotation_terms')
      .insert(termsToInsert)
      .select();

    if (termsError) {
      console.error('Error inserting terms:', termsError)
    } else {
      insertedTerms = insertedData;
    }
  }

  // Insert Testing Standards
  let insertedTestingStandards = [];
  if (testing_standards && testing_standards.length > 0) {
    const testingToInsert = testing_standards.map(tid => ({
      quotation_id: quotation.id,
      testing_standard_id: tid
    }))

    const { data: insertedData, error: testingError } = await adminClient
      .from('quotation_testing')
      .insert(testingToInsert)
      .select();

    if (testingError) {
      console.error('Error inserting testing standards:', testingError)
    } else {
      insertedTestingStandards = insertedData;
    }
  }

  // Create initial version snapshot
  const { error: versionError } = await adminClient
    .from('quotation_versions')
    .insert({
      quotation_id: quotation.id,
      version_number: 0,
      version_label: 'Rev.00',
      quotation_data: { // Snapshot of quotation header
        quotation_number: quotation.quotation_number,
        customer_id: quotation.customer_id,
        buyer_id: quotation.buyer_id,
        enquiry_id: quotation.enquiry_id,
        project_name: quotation.project_name,
        subtotal: quotation.subtotal,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        currency: quotation.currency,
        exchange_rate: quotation.exchange_rate,
        valid_until: quotation.valid_until,
        validity_days: quotation.validity_days,
        quotation_type: quotation.quotation_type,
        parent_quotation_id: quotation.parent_quotation_id,
        packing_charges: quotation.packing_charges,
        freight_charges: quotation.freight_charges,
        other_charges: quotation.other_charges,
        total_weight: quotation.total_weight,
        port_of_loading_id: quotation.port_of_loading_id,
        port_of_discharge_id: quotation.port_of_discharge_id,
        vessel_name: quotation.vessel_name,
        status: quotation.status,
        remarks: quotation.remarks,
        created_by: quotation.created_by,
        company_id: quotation.company_id,
        created_at: quotation.created_at,
        // Add other relevant fields from the quotation table
      },
      line_items: processedItems,
      terms_conditions: insertedTerms,
      // testing_standards: insertedTestingStandards, // Decide if testing standards are part of the version snapshot
      changed_by: user.id,
      change_reason: 'Initial creation',
      is_current: true,
    });

  if (versionError) {
    console.error('Error creating initial quotation version:', versionError);
    // Consider rolling back the quotation creation if version snapshot is critical
    // For now, just log the error.
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
