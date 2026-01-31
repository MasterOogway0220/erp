import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gst_number: z.string().optional().nullable(),
  is_approved: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  is_active: z.boolean().optional(),
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
  
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    return apiError('Vendor not found', 404)
  }
  
  return apiSuccess(vendor)
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
  
  const { data: existingVendor } = await adminClient
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!existingVendor) {
    return apiError('Vendor not found', 404)
  }
  
  const body = await request.json()
  const validation = updateVendorSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const { data: vendor, error } = await adminClient
    .from('vendors')
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return apiError(error.message)
  }
  
  await logAuditEvent('vendors', id, 'UPDATE', existingVendor, vendor, user.id)
  
  return apiSuccess(vendor)
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
  
  const { data: existingVendor } = await adminClient
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!existingVendor) {
    return apiError('Vendor not found', 404)
  }
  
  const { data: relatedPOs } = await adminClient
    .from('purchase_orders')
    .select('id')
    .eq('vendor_id', id)
    .limit(1)
  
  if (relatedPOs && relatedPOs.length > 0) {
    const { error } = await adminClient
      .from('vendors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      return apiError(error.message)
    }
    
    await logAuditEvent('vendors', id, 'UPDATE', existingVendor, { ...existingVendor, is_active: false }, user.id)
    
    return apiSuccess({ message: 'Vendor deactivated (has related records)' })
  }
  
  const { error } = await adminClient
    .from('vendors')
    .delete()
    .eq('id', id)
  
  if (error) {
    return apiError(error.message)
  }
  
  await logAuditEvent('vendors', id, 'DELETE', existingVendor, null, user.id)
  
  return apiSuccess({ message: 'Vendor deleted' })
}
