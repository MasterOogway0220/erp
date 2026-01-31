import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  primary_uom_id: z.string().uuid().optional(),
  internal_material_code: z.string().optional(),
  customer_material_code: z.string().optional(),
  hsn_code: z.string().optional().nullable(),
  base_price: z.number().min(0).optional(),
  description: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  wall_thickness: z.number().optional().nullable(),
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

  const { data: product, error } = await supabase
    .from('products')
    .select('*, uom:units_of_measure(*)')
    .eq('id', id)
    .single()

  if (error) {
    return apiError('Product not found', 404)
  }

  return apiSuccess(product)
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

  const { data: existingProduct } = await adminClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!existingProduct) {
    return apiError('Product not found', 404)
  }

  const body = await request.json()
  const validation = updateProductSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  if (validation.data.code && validation.data.code !== existingProduct.code) {
    const { data: codeExists } = await adminClient
      .from('products')
      .select('id')
      .eq('code', validation.data.code)
      .neq('id', id)
      .single()

    if (codeExists) {
      return apiError('Product code already exists')
    }
  }

  const { data: product, error } = await adminClient
    .from('products')
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

  await logAuditEvent('products', id, 'UPDATE', existingProduct, product, user.id)

  return apiSuccess(product)
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

  const { data: existingProduct } = await adminClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!existingProduct) {
    return apiError('Product not found', 404)
  }

  const { data: relatedItems } = await adminClient
    .from('enquiry_items')
    .select('id')
    .eq('product_id', id)
    .limit(1)

  if (relatedItems && relatedItems.length > 0) {
    const { error } = await adminClient
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return apiError(error.message)
    }

    await logAuditEvent('products', id, 'UPDATE', existingProduct, { ...existingProduct, is_active: false }, user.id)

    return apiSuccess({ message: 'Product deactivated (has related records)' })
  }

  const { error } = await adminClient
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return apiError(error.message)
  }

  await logAuditEvent('products', id, 'DELETE', existingProduct, null, user.id)

  return apiSuccess({ message: 'Product deleted' })
}
