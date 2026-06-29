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

export async function POST(req: Request) {
  const { caller_uid, user_id, action } = await req.json()
  if (!await verifyAdmin(caller_uid)) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (!user_id || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const account_status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  const admin = adminClient()

  const { error } = await admin.from('profiles').update({ account_status }).eq('id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // app_metadata에도 동기화 (proxy.ts에서 DB 없이 체크하기 위해)
  await admin.auth.admin.updateUserById(user_id, {
    app_metadata: { account_status },
  })

  return NextResponse.json({ ok: true, account_status })
}
