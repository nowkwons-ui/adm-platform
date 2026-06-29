import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 신규 유저면 이메일 확인 완료 상태로 미리 생성 → 확인 메일 차단
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find(u => u.email === email)
  if (!existing) {
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    })
  } else if (!existing.email_confirmed_at) {
    await admin.auth.admin.updateUserById(existing.id, { email_confirm: true })
  }

  // OTP 발송 (이미 이메일 확인된 상태라 확인 메일 안 감)
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    console.error('[send-otp error]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ message: 'OTP 발송 완료' })
}
