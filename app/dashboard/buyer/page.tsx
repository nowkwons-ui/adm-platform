'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  manager_name: string | null
  company_name: string | null
  role: string | null
  company_type: string[] | null
  account_status: string | null
  created_at: string | null
}

export default function MyInfoPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? null)

      // 서비스 롤을 쓰는 API로 RLS 우회
      const res = await fetch(`/api/auth/profile?uid=${user.id}`)
      const json = await res.json()
      setProfile(json.profile ?? null)
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>
  )

  const roleLabel = profile?.role === 'BUYER' ? '완제사' : profile?.role === 'SELLER' ? '원료사/에이전트' : '-'
  const statusLabel = profile?.account_status === 'APPROVED' ? '승인 완료'
    : profile?.account_status === 'PENDING' ? '승인 대기'
    : profile?.account_status === 'REJECTED' ? '반려'
    : '미등록'
  const statusColor = profile?.account_status === 'APPROVED' ? 'bg-green-100 text-green-700'
    : profile?.account_status === 'PENDING' ? 'bg-orange-100 text-orange-600'
    : 'bg-red-100 text-red-600'

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내정보</h1>
          <p className="text-sm text-gray-400 mt-1">가입 정보 및 계정 상태를 확인합니다.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          <Row label="이메일" value={email ?? '-'} />
          <Row label="담당자" value={profile?.manager_name ?? '-'} />
          <Row label="회사명" value={profile?.company_name ?? '-'} />
          <Row label="회원 유형" value={roleLabel} />
          <Row label="회사 유형" value={profile?.company_type?.join(', ') ?? '-'} />
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-500">계정 상태</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <Row label="가입일" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'} />
        </div>

        {profile?.account_status === 'PENDING' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 text-sm text-orange-700">
            관리자 승인 대기 중입니다. 승인 완료 시 이메일로 안내드립니다.
          </div>
        )}

        {(!profile || !profile.company_name) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700">
            회사 정보가 등록되지 않았습니다.{' '}
            <a href="/register" className="font-semibold underline">회원가입</a>을 다시 진행해주세요.
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}
