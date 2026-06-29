import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'nowkwons@naver.com'

export async function POST(req: Request) {
  const { company_name, manager_name, email, role, company_type, is_gmp_certified } = await req.json()

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'ADM Platform <onboarding@resend.dev>',
    to: ADMIN_EMAIL,
    subject: `[ADM] 신규 회원가입 신청 - ${company_name}`,
    html: `
      <h2>신규 회원가입 승인 요청</h2>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><td><b>회사명</b></td><td>${company_name}</td></tr>
        <tr><td><b>담당자</b></td><td>${manager_name}</td></tr>
        <tr><td><b>이메일</b></td><td>${email}</td></tr>
        <tr><td><b>회원유형</b></td><td>${role === 'buyer' ? '완제사' : '원료사/에이전트'}</td></tr>
        <tr><td><b>회사유형</b></td><td>${company_type}</td></tr>
        <tr><td><b>GMP인증</b></td><td>${is_gmp_certified ? '보유 (인증서 첨부됨)' : '없음'}</td></tr>
        <tr><td><b>신청시간</b></td><td>${new Date().toLocaleString('ko-KR')}</td></tr>
      </table>
      <br/>
      <p>관리자 대시보드에서 승인/반려 처리해주세요.</p>
    `,
  }).catch(console.error)

  return NextResponse.json({ ok: true })
}
