import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gst_number: z.string().optional().nullable(),
  is_approved: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const isActive = searchParams.get('is_active')
  const isApproved = searchParams.get('is_approved')
  const search = searchParams.get('search')
  
  let query = supabase
    .from('vendors')
    .select('*')
    .order('name', { ascending: true })
  
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true')
  }
  
  if (isApproved !== null) {
    query = query.eq('is_approved', isApproved === 'true')
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
  const validation = createVendorSchema.safeParse(body)
  
  if (!validation.success) {
    return apiError(validation.error.errors[0].message)
  }
  
  const vendorData = {
    ...validation.data,
    is_active: true,
    created_by: user.id,
  }
  
  const { data: vendor, error } = await adminClient
    .from('vendors')
    .insert(vendorData)
    .select()
    .single()
  
  if (error) {
    return apiError(error.message)
  }
  
  await logAuditEvent('vendors', vendor.id, 'CREATE', null, vendor, user.id)
  
  return apiSuccess(vendor, 201)
}
