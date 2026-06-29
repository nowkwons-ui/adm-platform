import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { uid, manager_name, company_name, role, company_type, account_status } = await req.json()

  if (!uid) return NextResponse.json({ error: '사용자 ID가 없습니다.' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: profileError } = await admin.from('profiles').upsert({
    id: uid,
    manager_name,
    company_name,
    role,
    company_type,
    account_status,
  })
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // app_metadata에도 role 저장 (Navbar 등에서 RLS 없이 읽기 위해)
  await admin.auth.admin.updateUserById(uid, {
    app_metadata: { role, account_status },
  })

  return NextResponse.json({ ok: true })
}
