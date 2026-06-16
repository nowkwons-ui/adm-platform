import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 문서 정보
  const { data: doc } = await supabase
    .from('data_room')
    .select('file_path, access_type, company_id')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!doc || !doc.file_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 무료 자료는 바로 URL 발급
  if (doc.access_type === 'FREE') {
    const { data } = await supabase.storage
      .from('data-room-files')
      .createSignedUrl(doc.file_path, 60)
    return NextResponse.json({ url: data?.signedUrl })
  }

  // 소유사 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (profile?.company_id === doc.company_id) {
    const { data } = await supabase.storage
      .from('data-room-files')
      .createSignedUrl(doc.file_path, 60)
    return NextResponse.json({ url: data?.signedUrl })
  }

  // 결제/승인 접근 권한 확인
  const { data: access } = await supabase
    .from('data_room_access')
    .select('id, expires_at')
    .eq('data_room_id', id)
    .eq('user_id', user.id)
    .single()

  const isExpired = access?.expires_at && new Date(access.expires_at) < new Date()

  if (!access || isExpired) {
    return NextResponse.json({ error: 'Access denied. Purchase required.' }, { status: 403 })
  }

  const { data } = await supabase.storage
    .from('data-room-files')
    .createSignedUrl(doc.file_path, 60)

  return NextResponse.json({ url: data?.signedUrl })
}
