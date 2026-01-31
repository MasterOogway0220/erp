import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
  try {
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUser?.users?.some(u => u.email === 'admin@erp.local')
    
    if (adminExists) {
      return NextResponse.json({ message: 'Demo user already exists' })
    }

    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@erp.local',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Admin',
        role: 'admin'
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (user?.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: user.user.id,
        email: 'admin@erp.local',
        full_name: 'System Admin',
        role: 'admin',
        is_active: true
      })
    }

    return NextResponse.json({ message: 'Demo user created', email: 'admin@erp.local' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
