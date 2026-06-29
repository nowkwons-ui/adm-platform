'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  email: string | null
  manager_name: string | null
  company_name: string | null
  role: string
  company_type: string[]
  is_approved: boolean
  created_at: string
}

export default function AdminMembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') { router.push('/'); return }

    loadMembers()
  }

  const loadMembers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, manager_name, company_name, role, company_type, is_approved, created_at, email:id(email)')
      .neq('role', 'ADMIN')
      .order('created_at', { ascending: false })

    // email은 auth.users에 있으므로 별도 조회
    if (data) {
      const supabaseAdmin = createClient()
      const enriched = await Promise.all(data.map(async (p) => {
        return { ...p, email: null }
      }))
      setMembers(enriched as Member[])
    }
    setLoading(false)
  }

  const handleApprove = async (id: string, approved: boolean) => {
    setActionLoading(id)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_approved: approved }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, is_approved: approved } : m))
    setActionLoading(null)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>

  const pending = members.filter(m => !m.is_approved)
  const approved = members.filter(m => m.is_approved)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-500 text-sm mt-1">가입 신청 승인 및 회원 관리</p>
        </div>

        {/* 승인 대기 */}
        <section>
          <h2 className="text-base font-semibold text-orange-600 mb-3">
            승인 대기 <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full ml-1">{pending.length}</span>
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">대기 중인 가입 신청이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {pending.map(m => (
                <MemberCard key={m.id} member={m} onApprove={handleApprove} actionLoading={actionLoading} />
              ))}
            </div>
          )}
        </section>

        {/* 승인 완료 */}
        <section>
          <h2 className="text-base font-semibold text-gray-600 mb-3">
            승인 완료 <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-1">{approved.length}</span>
          </h2>
          {approved.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">승인된 회원이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {approved.map(m => (
                <MemberCard key={m.id} member={m} onApprove={handleApprove} actionLoading={actionLoading} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function MemberCard({ member: m, onApprove, actionLoading }: {
  member: Member
  onApprove: (id: string, approved: boolean) => void
  actionLoading: string | null
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{m.company_name || '(회사명 없음)'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'BUYER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {m.role === 'BUYER' ? '완제사' : '원료사'}
          </span>
          {m.is_approved && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">승인됨</span>}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          담당자: {m.manager_name || '-'} · 유형: {m.company_type?.join(', ') || '-'}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          신청일: {new Date(m.created_at).toLocaleDateString('ko-KR')}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {!m.is_approved ? (
          <button
            onClick={() => onApprove(m.id, true)}
            disabled={actionLoading === m.id}
            className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium"
          >
            {actionLoading === m.id ? '처리 중...' : '승인'}
          </button>
        ) : (
          <button
            onClick={() => onApprove(m.id, false)}
            disabled={actionLoading === m.id}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50 font-medium"
          >
            승인 취소
          </button>
        )}
      </div>
    </div>
  )
}
