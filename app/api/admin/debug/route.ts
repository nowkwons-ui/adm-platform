import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, role, account_status, company_name, manager_name')

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  return NextResponse.json({
    profiles,
    auth_users: users.map(u => ({ id: u.id, email: u.email }))
  })
}
