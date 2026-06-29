import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types/database.types'

interface VerifyBody {
  email: string
  token: string
  manager_name: string
  company_name: string
  role: UserRole
  company_type: string[]
}

export async function POST(req: Request) {
  const body: VerifyBody = await req.json()
  const { email, token, manager_name, company_name, role, company_type } = body

  if (!email || !token) {
    return NextResponse.json({ error: '이메일과 OTP를 입력해주세요.' }, { status: 400 })
  }
  if (!manager_name || !company_name) {
    return NextResponse.json({ error: '담당자명과 회사명을 입력해주세요.' }, { status: 400 })
  }

  const supabase = await createServerClient()

  // OTP 검증 + user_metadata에 프로필 정보 포함
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !data.user) {
    return NextResponse.json({ error: 'OTP가 올바르지 않거나 만료되었습니다.' }, { status: 400 })
  }

  // user_metadata 업데이트 → DB 트리거가 이미 실행됐으므로 profiles 직접 update
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ manager_name, company_name, role, company_type })
    .eq('id', data.user.id)

  if (profileError) {
    return NextResponse.json({ error: '프로필 저장 실패: ' + profileError.message }, { status: 500 })
  }

  return NextResponse.json({ message: '회원가입 완료', user: data.user })
}
