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
  const { caller_uid, product_id, action, rejection_reason } = await req.json()
  if (!await verifyAdmin(caller_uid)) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (!product_id || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }
  if (action === 'REJECT' && !rejection_reason?.trim()) {
    return NextResponse.json({ error: '반려 사유를 입력해주세요.' }, { status: 400 })
  }

  const update = action === 'APPROVE'
    ? { status: 'APPROVED', rejection_reason: null }
    : { status: 'REJECTED', rejection_reason }

  const { error } = await adminClient().from('products').update(update).eq('id', product_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
