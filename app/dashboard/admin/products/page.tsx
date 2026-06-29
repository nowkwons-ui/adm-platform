'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  cas_no: string | null
  standard: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason: string | null
  created_at: string
  seller_id: string
  profiles: { company_name: string | null; manager_name: string | null } | null
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') { router.push('/'); return }
    loadProducts()
  }

  const loadProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*, profiles(company_name, manager_name)')
      .order('created_at', { ascending: false })
    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    const supabase = createClient()
    await supabase.from('products').update({ status: 'APPROVED', rejection_reason: null }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED', rejection_reason: null } : p))
    setActionLoading(null)
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setActionLoading(rejectTarget)
    const supabase = createClient()
    await supabase.from('products').update({ status: 'REJECTED', rejection_reason: rejectReason }).eq('id', rejectTarget)
    setProducts(prev => prev.map(p => p.id === rejectTarget ? { ...p, status: 'REJECTED', rejection_reason: rejectReason } : p))
    setRejectTarget(null)
    setRejectReason('')
    setActionLoading(null)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>

  const pending = products.filter(p => p.status === 'PENDING')
  const others = products.filter(p => p.status !== 'PENDING')

  const statusBadge = (status: string) => {
    if (status === 'APPROVED') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">승인</span>
    if (status === 'REJECTED') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">반려</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">대기</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
          <p className="text-gray-500 text-sm mt-1">원료 등록 승인 및 반려</p>
        </div>

        {/* 반려 모달 */}
        {rejectTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">반려 사유 입력</h3>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="반려 사유를 입력해주세요."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setRejectTarget(null); setRejectReason('') }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
                <button onClick={handleReject} disabled={!rejectReason.trim() || !!actionLoading}
                  className="px-5 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium">
                  반려 처리
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 승인 대기 */}
        <section>
          <h2 className="text-base font-semibold text-orange-600 mb-3">
            승인 대기 <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full ml-1">{pending.length}</span>
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">대기 중인 상품이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {pending.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      {statusBadge(p.status)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      CAS: {p.cas_no || '-'} · 규격: {p.standard || '-'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      공급사: {p.profiles?.company_name || '-'} · {new Date(p.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(p.id)} disabled={!!actionLoading}
                      className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium">
                      승인
                    </button>
                    <button onClick={() => setRejectTarget(p.id)} disabled={!!actionLoading}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium">
                      반려
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 처리 완료 */}
        <section>
          <h2 className="text-base font-semibold text-gray-600 mb-3">
            처리 완료 <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-1">{others.length}</span>
          </h2>
          {others.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">처리된 상품이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {others.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{p.name}</span>
                    {statusBadge(p.status)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    CAS: {p.cas_no || '-'} · 규격: {p.standard || '-'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    공급사: {p.profiles?.company_name || '-'} · {new Date(p.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  {p.rejection_reason && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                      반려 사유: {p.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
