import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verifyAdmin(uid: string | null) {
  if (!uid) return false
  const { data } = await adminClient().auth.admin.getUserById(uid)
  return data.user?.app_metadata?.role === 'ADMIN'
}

export async function GET(req: Request) {
  const uid = new URL(req.url).searchParams.get('uid')
  if (!await verifyAdmin(uid)) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const admin = adminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, manager_name, company_name, role, company_type, account_status, created_at')
    .neq('role', 'ADMIN')
    .order('created_at', { ascending: false })

  if (!profiles) return NextResponse.json({ users: [] })

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? null]))

  return NextResponse.json({
    users: profiles.map(p => ({ ...p, email: emailMap[p.id] ?? null }))
  })
}
