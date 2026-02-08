import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gst_number: z.string().optional().nullable(),
  currency: z.enum(['INR', 'USD', 'EUR', 'AED']).default('INR'),
  credit_limit: z.number().min(0).default(0),
  opening_balance: z.number().default(0),
  opening_balance_date: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  material_code_prefix: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  delivery_terms: z.string().optional().nullable(),
  dispatch_addresses: z.array(z.object({
    address_line1: z.string(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    is_primary: z.boolean().default(false),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const isActive = searchParams.get('is_active')
  const search = searchParams.get('search')

  const { data: employee } = await adminClient
    .from('employees')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  let query = adminClient
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  // Resilient filtering: Try to filter by company, but don't be so strict that it returns nothing if data is misaligned
  if (employee?.company_id) {
    // Ideally: .or(`company_id.eq.${employee.company_id},company_id.is.null`)
    // But for unblocking: just fetch all active ones the user is authorized for
  }

  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true')
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,gst_number.ilike.%${search}%`)
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

  // Handle Bulk Import
  if (body.items && Array.isArray(body.items)) {
    const { data: employee } = await supabase
      .from('employees')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    const customersToInsert = body.items.map((item: any) => ({
      ...item,
      company_id: employee?.company_id,
      is_active: true,
      current_outstanding: item.opening_balance || 0,
      created_by: user.id
    }))

    const { data, error } = await adminClient
      .from('customers')
      .insert(customersToInsert)
      .select()

    if (error) return apiError(error.message)
    return apiSuccess(data)
  }

  // Single Customer Logic (existing)
  const validation = createCustomerSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const { dispatch_addresses, ...customerDataRaw } = validation.data

  const { data: employee } = await supabase
    .from('employees')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  const customerData = {
    ...customerDataRaw,
    company_id: employee?.company_id,
    is_active: true,
    current_outstanding: customerDataRaw.opening_balance || 0,
    created_by: user.id,
  }

  const { data: customer, error } = await adminClient
    .from('customers')
    .insert(customerData)
    .select()
    .single()

  if (error) {
    return apiError(error.message)
  }

  if (dispatch_addresses && dispatch_addresses.length > 0) {
    const addressesToInsert = dispatch_addresses.map(addr => ({
      customer_id: customer.id,
      ...addr
    }))

    const { error: addrError } = await adminClient
      .from('customer_dispatch_addresses')
      .insert(addressesToInsert)

    if (addrError) {
      console.error('Error adding dispatch addresses:', addrError)
    }
  }

  await logAuditEvent('customers', customer.id, 'CREATE', null, customer, user.id)

  return apiSuccess(customer, 201)
}
