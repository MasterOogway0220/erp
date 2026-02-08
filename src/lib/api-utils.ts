import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function logAuditEvent(
  tableName: string,
  recordId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'AMENDMENT',
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  userId?: string
) {
  const supabase = createAdminClient()

  try {
    await supabase.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action,
      old_data: oldData,
      new_data: newData,
      user_id: userId,
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

export async function generateDocumentNumber(
  prefix: string,
  companyId?: string,
  companyCode?: string
): Promise<string> {
  const supabase = createAdminClient()
  const year = new Date().getFullYear()

  // Get company code if provided
  let code = companyCode || 'STC' // Use provided code or default

  // Only fetch if companyId is provided AND companyCode is NOT provided
  if (companyId && !companyCode) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    if (company?.name) {
      code = company.name.substring(0, 3).toUpperCase();
    }
  }

  const key = `${prefix}-${code}-${year}`

  const { data, error } = await supabase.rpc('get_next_sequence', {
    p_prefix: key
  })

  if (error) {
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}/${companyCode}/${year}/${random.toString().padStart(4, '0')}`
  }

  return `${prefix}/${companyCode}/${year}/${data.toString().padStart(4, '0')}`
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status })
}

export function apiPaginatedSuccess<T>(
  data: T,
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  },
  status: number = 200
) {
  return NextResponse.json({ data, pagination }, { status })
}

export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const supabase = createAdminClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}
