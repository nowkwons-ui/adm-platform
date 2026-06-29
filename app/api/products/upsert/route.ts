import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const { uid, id, name, cas_no, dmf_no, manufacturer, supplier_name, standard, price_info, notes, document_path } = await req.json()
  if (!uid) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!name) return NextResponse.json({ error: '성분명을 입력해주세요.' }, { status: 400 })

  const admin = adminClient()

  // 권한 확인
  const { data: authUser } = await admin.auth.admin.getUserById(uid)
  const role = authUser?.user?.app_metadata?.role as string
  if (!['ADMIN', 'SELLER'].includes(role)) {
    return NextResponse.json({ error: '판매자만 원료를 등록할 수 있습니다.' }, { status: 403 })
  }

  const { data: profile } = await admin.from('profiles').select('company_name').eq('id', uid).single()

  let result
  if (id) {
    // 재승인 요청 (REJECTED → PENDING)
    const { data, error } = await admin
      .from('products')
      .update({ name, cas_no, dmf_no, manufacturer, supplier_name, standard, price_info, notes, document_path, status: 'PENDING', rejection_reason: null })
      .eq('id', id)
      .eq('seller_id', uid)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    // 신규 등록
    const { data, error } = await admin
      .from('products')
      .insert({ seller_id: uid, name, cas_no, dmf_no, manufacturer, supplier_name, standard, price_info, notes, document_path, status: 'PENDING' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  // 관리자 알림 이메일 (실패해도 무시, 응답 기다리지 않음)
  const ADMIN_EMAIL = 'sbkwon@kukjeon.co.kr'
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ADM Platform <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `[ADM] ${id ? '재승인 요청' : '신규 원료 등록'} - ${name}`,
      html: `<h2>${id ? '재승인 요청' : '신규 원료 등록'} 알림</h2>
        <p>업체명: ${profile?.company_name ?? '-'}</p>
        <p>성분명: ${name}</p>
        <p>등록시간: ${new Date().toLocaleString('ko-KR')}</p>`,
    }),
  }).catch(() => null)

  return NextResponse.json({ product: result }, { status: 201 })
}
