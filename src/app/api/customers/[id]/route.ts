import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gst_number: z.string().optional().nullable(),
  currency: z.enum(['INR', 'USD', 'EUR', 'AED']).optional(),
  credit_limit: z.number().min(0).optional(),
  opening_balance: z.number().optional(),
  opening_balance_date: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  material_code_prefix: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  delivery_terms: z.string().optional().nullable(),
  default_terms_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
  dispatch_addresses: z.array(z.object({
    id: z.string().uuid().optional(),
    address_line1: z.string(),
    address_line2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    is_primary: z.boolean().default(false),
  })).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, dispatch_addresses:customer_dispatch_addresses(*)')
    .eq('id', id)
    .single()

  if (error) {
    return apiError('Customer not found', 404)
  }

  return apiSuccess(customer)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data: existingCustomer } = await adminClient
    .from('customers')
    .select('*, dispatch_addresses:customer_dispatch_addresses(*)')
    .eq('id', id)
    .single()

  if (!existingCustomer) {
    return apiError('Customer not found', 404)
  }

  const body = await request.json()
  const validation = updateCustomerSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const { dispatch_addresses, ...customerData } = validation.data

  // Update Customer basic data
  const { data: updatedCustomer, error: updateError } = await adminClient
    .from('customers')
    .update({
      ...customerData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return apiError(updateError.message)
  }

  // Handle Dispatch Addresses (Replace all or clever update?)
  // For simplicity: delete old ones and insert new ones, OR update by ID.
  // Re-inserting is easier but might break IDs if linked elsewhere. 
  // Let's do a replace for now.
  if (dispatch_addresses !== undefined) {
    // Delete existing
    await adminClient
      .from('customer_dispatch_addresses')
      .delete()
      .eq('customer_id', id)

    // Insert new
    if (dispatch_addresses.length > 0) {
      const toInsert = dispatch_addresses.map(addr => ({
        customer_id: id,
        address_line1: addr.address_line1,
        address_line2: addr.address_line2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        is_primary: addr.is_primary
      }))

      const { error: insertError } = await adminClient
        .from('customer_dispatch_addresses')
        .insert(toInsert)

      if (insertError) {
        console.error("Error inserting dispatch addresses:", insertError)
      }
    }
  }

  await logAuditEvent('customers', id, 'UPDATE', existingCustomer, updatedCustomer, user.id)

  // Return fully updated customer
  const { data: finalCustomer } = await adminClient
    .from('customers')
    .select('*, dispatch_addresses:customer_dispatch_addresses(*)')
    .eq('id', id)
    .single()

  return apiSuccess(finalCustomer)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data: existingCustomer } = await adminClient
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!existingCustomer) {
    return apiError('Customer not found', 404)
  }

  // Check for foreign key constraints in related tables
  const { data: relatedEnquiries } = await adminClient
    .from('enquiries')
    .select('id')
    .eq('customer_id', id)
    .limit(1)

  if (relatedEnquiries && relatedEnquiries.length > 0) {
    const { error } = await adminClient
      .from('customers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return apiError(error.message)
    }

    await logAuditEvent('customers', id, 'UPDATE', existingCustomer, { ...existingCustomer, is_active: false }, user.id)

    return apiSuccess({ message: 'Customer deactivated (has related records)' })
  }

  const { error } = await adminClient
    .from('customers')
    .delete()
    .eq('id', id)

  if (error) {
    return apiError(error.message)
  }

  await logAuditEvent('customers', id, 'DELETE', existingCustomer, null, user.id)

  return apiSuccess({ message: 'Customer deleted' })
}
