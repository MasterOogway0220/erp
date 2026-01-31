import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')
  
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (unreadOnly) {
    query = query.eq('is_read', false)
  }
  
  const { data, error } = await query
  
  if (error) {
    return apiError(error.message)
  }
  
  const { data: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  return apiSuccess({
    notifications: data || [],
    unreadCount: unreadCount?.length || 0,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  
  const body = await request.json()
  const { action, notificationIds } = body
  
  if (action === 'mark_read') {
    if (notificationIds && Array.isArray(notificationIds)) {
      await adminClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds)
    } else {
      await adminClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
    }
  }
  
  return apiSuccess({ success: true })
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  referenceType?: string,
  referenceId?: string
) {
  const adminClient = createAdminClient()
  
  await adminClient.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    reference_type: referenceType,
    reference_id: referenceId,
  })
}

export async function notifyRoleUsers(
  role: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  referenceType?: string,
  referenceId?: string
) {
  const adminClient = createAdminClient()
  
  const { data: users } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('role', role)
  
  if (users && users.length > 0) {
    const notifications = users.map(u => ({
      user_id: u.user_id,
      title,
      message,
      type,
      reference_type: referenceType,
      reference_id: referenceId,
    }))
    
    await adminClient.from('notifications').insert(notifications)
  }
}
