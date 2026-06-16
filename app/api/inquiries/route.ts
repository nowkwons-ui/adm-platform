import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // BUYER 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'BUYER') {
    return NextResponse.json({ error: 'Only buyers can submit inquiries' }, { status: 403 })
  }

  const { api_id, seller_id, data_room_id, subject, message } = await req.json()

  if (!seller_id || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 문의 생성
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .insert({ buyer_id: user.id, seller_id, api_id, data_room_id, subject })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 첫 메시지 저장
  await supabase.from('inquiry_messages').insert({
    inquiry_id: inquiry.id,
    sender_id: user.id,
    message,
  })

  // 판매자 인앱 알림
  await supabase.from('notifications').insert({
    user_id: seller_id,
    type: 'NEW_INQUIRY',
    title: '새로운 견적 문의가 도착했습니다',
    body: subject,
    link: `/dashboard/seller/inquiries/${inquiry.id}`,
  })

  return NextResponse.json({ inquiry }, { status: 201 })
}
