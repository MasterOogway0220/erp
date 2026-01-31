import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, logAuditEvent } from '@/lib/api-utils'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"), // This is typically the visible SKU/Code
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"), // Legacy text unit
  primary_uom_id: z.string().uuid().optional(), // New linked UOM
  internal_material_code: z.string().optional(),
  customer_material_code: z.string().optional(),
  hsn_code: z.string().optional().nullable(),
  base_price: z.number().min(0).default(0),
  description: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  wall_thickness: z.number().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const isActive = searchParams.get('is_active')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let query = supabase
    .from('products')
    .select('*, uom:units_of_measure(code, name)') // Join UOM
    .order('name', { ascending: true })

  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true')
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,hsn_code.ilike.%${search}%`)
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
    const productsToInsert = body.items.map((item: any) => ({
      ...item,
      is_active: true,
      created_by: user.id
    }))

    const { data, error } = await adminClient
      .from('products')
      .insert(productsToInsert)
      .select()

    if (error) return apiError(error.message)
    return apiSuccess(data)
  }

  // Single Product Logic (existing)
  const validation = createProductSchema.safeParse(body)

  if (!validation.success) {
    return apiError(validation.error.issues[0].message)
  }

  const { data: existingProduct } = await adminClient
    .from('products')
    .select('id')
    .eq('code', validation.data.code)
    .single()

  if (existingProduct) {
    return apiError('Product code already exists')
  }

  // Auto-generate Internal Material Code logic (CATEGORY-MATERIAL-NNNN)
  let internalCode = validation.data.internal_material_code
  if (!internalCode) {
    const categoryPrefix = (validation.data.category || 'GEN').substring(0, 4).toUpperCase()
    const materialPrefix = (validation.data.grade || 'MAT').substring(0, 4).toUpperCase()

    // Find latest code for this category and material
    const { data: lastProducts } = await adminClient
      .from('products')
      .select('internal_material_code')
      .ilike('internal_material_code', `${categoryPrefix}-${materialPrefix}-%`)
      .order('internal_material_code', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (lastProducts && lastProducts.length > 0) {
      const lastCode = lastProducts[0].internal_material_code
      const parts = lastCode.split('-')
      const lastNum = parseInt(parts[parts.length - 1])
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1
      }
    }

    internalCode = `${categoryPrefix}-${materialPrefix}-${nextNum.toString().padStart(4, '0')}`
  }

  const productData = {
    ...validation.data,
    internal_material_code: internalCode,
    is_active: true,
    created_by: user.id,
  }

  const { data: product, error } = await adminClient
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) {
    return apiError(error.message)
  }

  await logAuditEvent('products', product.id, 'CREATE', null, product, user.id)

  return apiSuccess(product, 201)
}
