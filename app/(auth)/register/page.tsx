'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { UserRole, CompanyType } from '@/types/database.types'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'BUYER' as UserRole,
    company_name: '',
    company_type: 'PHARMACEUTICAL' as CompanyType,
    country: 'KR',
    is_gmp_certified: false,
  })

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Supabase Auth 회원가입
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError || !authData.user) {
      setError(authError?.message ?? '회원가입에 실패했습니다.')
      setLoading(false)
      return
    }

    // 2. 회사 생성
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: form.company_name,
        company_type: form.company_type,
        country: form.country,
        is_gmp_certified: form.is_gmp_certified,
        is_foreign_manufacturer_reg: false,
      })
      .select()
      .single()

    if (companyError || !company) {
      setError('회사 정보 등록에 실패했습니다.')
      setLoading(false)
      return
    }

    // 3. 프로필 생성 (트리거로 자동 생성된 profile 업데이트)
    await supabase
      .from('profiles')
      .update({ role: form.role, full_name: form.full_name, company_id: company.id })
      .eq('id', authData.user.id)

    router.push('/')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-700">ADM</Link>
          <p className="text-gray-500 text-sm mt-2">회원가입</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이름 *</label>
              <input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="col-span-2 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">회원 유형</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'BUYER', label: '완제사 (구매)', desc: '원료/자료 구매' },
                  { value: 'SELLER', label: '원료사/에이전트 (판매)', desc: '원료/자료 등록' },
                ] as const).map((opt) => (
                  <label key={opt.value}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-colors ${form.role === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="role" value={opt.value} checked={form.role === opt.value}
                      onChange={() => set('role', opt.value)} className="sr-only" />
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">회사 정보</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
              <input type="text" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회사 유형</label>
              <select value={form.company_type} onChange={(e) => set('company_type', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="PHARMACEUTICAL">제약사</option>
                <option value="MANUFACTURER">제조사</option>
                <option value="AGENT">에이전트</option>
                <option value="DISTRIBUTOR">유통사</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">국가</label>
              <select value={form.country} onChange={(e) => set('country', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="KR">대한민국</option>
                <option value="IN">인도</option>
                <option value="CN">중국</option>
                <option value="US">미국</option>
                <option value="EU">유럽</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_gmp_certified}
                  onChange={(e) => set('is_gmp_certified', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">GMP 인증 보유</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 mt-2">
            {loading ? '가입 중...' : '회원가입'}
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
