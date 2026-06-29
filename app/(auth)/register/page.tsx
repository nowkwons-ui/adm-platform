'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database.types'

const OTP_COOLDOWN = 120 // 2분 (초)

const BUYER_TYPES = ['완제의약품', '건기식', '식품', '화장품']
const SELLER_TYPES = ['원료의약품 합성', '원료의약품 수입', '원료의약품 도매', '화장품원료 합성', '화장품원료 수입', '화장품원료 도매']

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const startCooldown = () => {
    setCooldown(OTP_COOLDOWN)
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

  const [form, setForm] = useState({
    email: '',
    password: '',
    password_confirm: '',
    otp: '',
    manager_name: '',
    role: 'BUYER' as UserRole,
    company_type: '완제의약품',
    company_name: '',
    country: 'KR',
    is_gmp_certified: false,
  })

  const set = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }))
  const currentTypes = form.role === 'BUYER' ? BUYER_TYPES : SELLER_TYPES

  const sendOtp = async () => {
    if (!form.email) { setError('이메일을 입력해주세요.'); return }
    setOtpLoading(true); setError('')
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setOtpLoading(false); return }
    setOtpSent(true)
    setOtpLoading(false)
    startCooldown()
  }

  const verifyOtp = async () => {
    if (form.otp.length !== 6) { setError('6자리 인증번호를 입력해주세요.'); return }
    setOtpLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email: form.email, token: form.otp, type: 'email' })
    if (error) { setError('인증번호가 올바르지 않거나 만료되었습니다.'); setOtpLoading(false); return }
    setOtpVerified(true)
    setOtpLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpVerified) { setError('이메일 인증을 완료해주세요.'); return }
    if (form.password !== form.password_confirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }

    setLoading(true); setError('')
    const supabase = createClient()

    const { error: pwError } = await supabase.auth.updateUser({ password: form.password })
    if (pwError) { setError('비밀번호 설정 실패: ' + pwError.message); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('세션이 만료되었습니다. 다시 시도해주세요.'); setLoading(false); return }

    const profileRes = await fetch('/api/auth/save-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.id,
        manager_name: form.manager_name,
        company_name: form.company_name,
        role: form.role,
        company_type: [form.company_type],
        account_status: 'PENDING',
      }),
    })
    const profileData = await profileRes.json()
    if (!profileRes.ok) { setError('프로필 저장 실패: ' + profileData.error); setLoading(false); return }

    if (form.is_gmp_certified && certFile) {
      const ext = certFile.name.split('.').pop()
      await supabase.storage.from('certificates').upload(`${user.id}/gmp_certificate.${ext}`, certFile, { upsert: true })
    }

    await fetch('/api/auth/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: form.company_name,
        manager_name: form.manager_name,
        email: form.email,
        role: form.role,
        company_type: form.company_type,
        is_gmp_certified: form.is_gmp_certified,
      }),
    }).catch(() => null)

    router.push('/register/pending')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-700">ADM</Link>
          <p className="text-gray-500 text-sm mt-2">회원가입</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

          {/* 이메일 + 인증번호 발송 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
            <div className="flex gap-2">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                required disabled={otpVerified} placeholder="example@company.com"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
              <button type="button" onClick={sendOtp}
                disabled={otpVerified || otpLoading || cooldown > 0}
                className="px-4 py-3 bg-blue-700 text-white text-sm rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap min-w-[110px]">
                {otpLoading ? '발송 중...' : cooldown > 0 ? `재발송 (${formatTime(cooldown)})` : otpSent ? '재발송' : '인증번호 발송'}
              </button>
            </div>
          </div>

          {/* OTP 입력란 — 발송 후 표시 */}
          {otpSent && !otpVerified && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-xs text-blue-700 font-medium">
                📧 <b>{form.email}</b> 로 인증번호를 발송했습니다.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">인증번호 6자리 *</label>
                <div className="flex gap-2">
                  <input type="text" value={form.otp}
                    onChange={e => set('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6} placeholder="· · · · · ·" autoFocus
                    className="flex-1 px-4 py-3 rounded-lg border border-blue-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em] text-center text-xl font-mono" />
                  <button type="button" onClick={verifyOtp}
                    disabled={otpLoading || form.otp.length !== 6}
                    className="px-5 py-3 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
                    {otpLoading ? '확인 중...' : '인증 확인'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">메일이 오지 않으면 스팸함을 확인하거나 재발송 해주세요.</p>
              </div>
            </div>
          )}

          {otpVerified && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg font-medium">
              ✓ 이메일 인증이 완료되었습니다.
            </div>
          )}

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              required minLength={6} placeholder="6자 이상"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인 *</label>
            <input type="password" value={form.password_confirm} onChange={e => set('password_confirm', e.target.value)}
              required placeholder="비밀번호 재입력"
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                form.password_confirm && form.password !== form.password_confirm ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`} />
            {form.password_confirm && form.password !== form.password_confirm && (
              <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
            {form.password_confirm && form.password === form.password_confirm && (
              <p className="text-xs text-green-600 mt-1">✓ 비밀번호가 일치합니다.</p>
            )}
          </div>

          {/* 담당자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이름 *</label>
            <input type="text" value={form.manager_name} onChange={e => set('manager_name', e.target.value)} required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* 회원 유형 */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">회원 유형</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'BUYER', label: '완제사', desc: '원료/자료 구매' },
                { value: 'SELLER', label: '원료사/에이전트', desc: '원료/자료 판매 등록' },
              ] as const).map(opt => (
                <label key={opt.value}
                  className={`cursor-pointer border-2 rounded-xl p-4 transition-colors ${form.role === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <input type="radio" name="role" value={opt.value} checked={form.role === opt.value}
                    onChange={() => setForm(f => ({
                      ...f, role: opt.value,
                      company_type: opt.value === 'BUYER' ? '완제의약품' : '원료의약품 합성',
                    }))} className="sr-only" />
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* 회사 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">회사 유형 *</label>
            <div className="grid grid-cols-2 gap-2">
              {currentTypes.map(t => (
                <label key={t}
                  className={`cursor-pointer border-2 rounded-lg px-4 py-3 text-sm transition-colors ${form.company_type === t ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  <input type="radio" name="company_type" value={t} checked={form.company_type === t}
                    onChange={() => set('company_type', t)} className="sr-only" />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">회사 정보</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
            <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)} required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">국가</label>
            <select value={form.country} onChange={e => set('country', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="KR">대한민국</option>
              <option value="IN">인도</option>
              <option value="CN">중국</option>
              <option value="US">미국</option>
              <option value="EU">유럽</option>
            </select>
          </div>

          {/* GMP/GIP 인증 */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_gmp_certified}
                onChange={e => set('is_gmp_certified', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">GMP / GIP 인증 보유</span>
            </label>
            {form.is_gmp_certified && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">인증서 파일 업로드 (PDF, JPG, PNG)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setCertFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {certFile && <p className="text-xs text-green-600 mt-1">✓ {certFile.name}</p>}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 mt-2">
            {loading ? '가입 신청 중...' : '회원가입 신청'}
          </button>

          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-700 font-medium hover:underline">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
