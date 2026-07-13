'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'members' | 'manage' | 'products' | 'licenses'

interface LicenseDoc {
  id: number
  title: string
  type: string
  standard: string
  equipment: string
  pages: number
  price: number
  verified: boolean
  isNew: boolean
  tags: string[]
  submittedBy?: string
  submittedAt: string
}

const DUMMY_LICENSES: LicenseDoc[] = [
  { id: 1, title: '발사르탄 니트로사민 유전독성 불순물 MV 보고서', type: 'MV', standard: 'MFDS', equipment: 'HPLC', pages: 45, price: 3000000, verified: true, isNew: false, tags: ['니트로사민', 'NDMA'], submittedBy: '국전약품', submittedAt: '2026-06-20' },
  { id: 2, title: '메트포르민 CTD 모듈 3 완성본 (ICH Q3A 기반)', type: 'CTD', standard: 'MFDS', equipment: 'LC-MS/MS', pages: 120, price: 5500000, verified: true, isNew: false, tags: ['CTD', 'ICH Q3A'], submittedBy: 'sb제약', submittedAt: '2026-06-22' },
  { id: 3, title: '고성능 UV 흡광도 별규시험법 SOP 표준 양식', type: 'SOP', standard: 'USP', equipment: 'UV-Vis', pages: 18, price: 480000, verified: false, isNew: true, tags: ['SOP', '별규시험법'], submittedBy: '권팜', submittedAt: '2026-07-01' },
  { id: 4, title: '세파클러 용출 시험법 밸리데이션 프로토콜', type: 'Protocol', standard: 'EP', equipment: 'HPLC', pages: 32, price: 1200000, verified: false, isNew: true, tags: ['용출시험', '밸리데이션'], submittedBy: '권팜', submittedAt: '2026-07-05' },
  { id: 5, title: '아토르바스타틴 CV 적격성 평가 보고서 (IQ/OQ/PQ)', type: 'CV', standard: 'MFDS', equipment: 'HPLC', pages: 67, price: 2200000, verified: true, isNew: false, tags: ['CV', '적격성평가'], submittedBy: '국전약품', submittedAt: '2026-06-25' },
  { id: 6, title: '아목시실린 원료 CTD Module 2 품질총괄보고서', type: 'CTD', standard: 'MFDS', equipment: 'GC', pages: 88, price: 4000000, verified: false, isNew: true, tags: ['CTD', '항생제'], submittedBy: 'sb제약', submittedAt: '2026-07-08' },
  { id: 7, title: 'GC-Headspace 잔류용매 시험법 MV 완성 패키지', type: 'MV', standard: 'USP', equipment: 'GC', pages: 53, price: 1800000, verified: true, isNew: false, tags: ['잔류용매', 'ICH Q3C'], submittedBy: '권팜', submittedAt: '2026-06-18' },
  { id: 8, title: '니트로사민류 위험평가 SOP 및 체크리스트', type: 'SOP', standard: 'MFDS', equipment: 'LC-MS/MS', pages: 24, price: 650000, verified: false, isNew: true, tags: ['니트로사민', '위험평가'], submittedBy: '국전약품', submittedAt: '2026-07-10' },
]

const LICENSE_TYPE_COLORS: Record<string, string> = {
  MV: 'bg-blue-100 text-blue-700',
  CTD: 'bg-purple-100 text-purple-700',
  CV: 'bg-teal-100 text-teal-700',
  SOP: 'bg-orange-100 text-orange-700',
  Protocol: 'bg-green-100 text-green-700',
}

interface Member {
  id: string
  email: string | null
  manager_name: string | null
  company_name: string | null
  role: string
  company_type: string[]
  account_status: string
  created_at: string
}

interface Product {
  id: string
  name: string
  cas_no: string | null
  dmf_no: string | null
  manufacturer: string | null
  supplier_name: string | null
  standard: string | null
  price_info: string | null
  notes: string | null
  document_path: string | null
  status: string
  rejection_reason: string | null
  created_at: string
  profiles: { company_name: string | null; manager_name: string | null } | null
}

const STATUS_LABEL: Record<string, string> = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려' }
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('members')
  const [members, setMembers] = useState<Member[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: 'member' | 'product' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [callerUid, setCallerUid] = useState<string | null>(null)

  // 회원 관리 탭
  const [memberSearch, setMemberSearch] = useState('')
  const [memberStatusFilter, setMemberStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const [detailTarget, setDetailTarget] = useState<Member | null>(null)

  // 원료 관리 탭
  const [productSearch, setProductSearch] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [productDetail, setProductDetail] = useState<Product | null>(null)

  // 허가자료 탭
  const [licenses, setLicenses] = useState<LicenseDoc[]>(DUMMY_LICENSES)
  const [licenseSearch, setLicenseSearch] = useState('')
  const [licenseFilter, setLicenseFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL')
  const [licenseDetail, setLicenseDetail] = useState<LicenseDoc | null>(null)

  const toggleLicenseVerify = (id: number) => {
    setLicenses(prev => prev.map(d => d.id === id ? { ...d, verified: !d.verified } : d))
    setLicenseDetail(prev => prev?.id === id ? { ...prev, verified: !prev.verified } : prev)
  }
  const deleteL = (id: number) => {
    setLicenses(prev => prev.filter(d => d.id !== id))
    setLicenseDetail(null)
  }

  const filteredLicenses = licenses.filter(d => {
    if (licenseFilter === 'PENDING' && d.verified) return false
    if (licenseFilter === 'VERIFIED' && !d.verified) return false
    const q = licenseSearch.toLowerCase()
    return !q || d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || (d.submittedBy ?? '').toLowerCase().includes(q)
  })
  const pendingLicenses = licenses.filter(d => !d.verified)

  const checkAdmin = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return null }
    if (user.app_metadata?.role !== 'ADMIN') { router.push('/'); return null }
    setCallerUid(user.id)
    return user.id
  }, [router])

  const loadMembers = useCallback(async (uid: string) => {
    const res = await fetch(`/api/admin/users/list?uid=${uid}`)
    const data = await res.json()
    setMembers(data.users ?? [])
  }, [])

  const loadProducts = useCallback(async (uid: string) => {
    const res = await fetch(`/api/admin/products/list?uid=${uid}`)
    const data = await res.json()
    setProducts(data.products ?? [])
  }, [])

  useEffect(() => {
    checkAdmin().then(uid => {
      if (!uid) return
      Promise.all([loadMembers(uid), loadProducts(uid)]).finally(() => setLoading(false))
    })
  }, [checkAdmin, loadMembers, loadProducts])

  const evaluateUser = async (user_id: string, action: 'APPROVE' | 'REJECT') => {
    setActionId(user_id)
    const res = await fetch('/api/admin/users/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caller_uid: callerUid, user_id, action }),
    })
    if (res.ok) {
      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      setMembers(prev => prev.map(m => m.id === user_id ? { ...m, account_status: newStatus } : m))
    }
    setActionId(null)
  }

  const evaluateProduct = async (product_id: string, action: 'APPROVE' | 'REJECT', rejection_reason?: string) => {
    setActionId(product_id)
    const res = await fetch('/api/admin/products/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caller_uid: callerUid, product_id, action, rejection_reason }),
    })
    if (res.ok) {
      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      setProducts(prev => prev.map(p => p.id === product_id ? { ...p, status: newStatus, rejection_reason: rejection_reason ?? null } : p))
      setProductDetail(prev => prev?.id === product_id ? { ...prev, status: newStatus } : prev)
    }
    setActionId(null)
  }

  const deleteUser = async (user_id: string) => {
    setActionId(user_id)
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    })
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== user_id))
    setActionId(null)
    setDeleteTarget(null)
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    if (rejectTarget.type === 'product') {
      await evaluateProduct(rejectTarget.id, 'REJECT', rejectReason)
    } else {
      await evaluateUser(rejectTarget.id, 'REJECT')
    }
    setRejectTarget(null)
    setRejectReason('')
  }

  const pendingMembers = members.filter(m => m.account_status === 'PENDING')
  const pendingProducts = products.filter(p => p.status === 'PENDING')

  const filteredMembers = members.filter(m => {
    const matchStatus = memberStatusFilter === 'ALL' || m.account_status === memberStatusFilter
    const q = memberSearch.toLowerCase()
    const matchSearch = !q ||
      (m.company_name ?? '').toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.manager_name ?? '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const filteredProducts = products.filter(p => {
    const matchStatus = productStatusFilter === 'ALL' || p.status === productStatusFilter
    const q = productSearch.toLowerCase()
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.cas_no ?? '').toLowerCase().includes(q) ||
      (p.profiles?.company_name ?? '').toLowerCase().includes(q) ||
      (p.supplier_name ?? '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 반려 모달 */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">반려 사유 입력</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력해주세요." rows={4} autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
              <button onClick={handleRejectConfirm} disabled={!rejectReason.trim() || !!actionId}
                className="px-5 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium">
                반려 처리
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">계정 삭제</h3>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{deleteTarget.company_name || deleteTarget.email}</span> 계정을 삭제하시겠습니까?
              <br /><span className="text-red-500 text-xs">삭제 후 복구할 수 없습니다.</span>
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-500">취소</button>
              <button onClick={() => deleteUser(deleteTarget.id)} disabled={actionId === deleteTarget.id}
                className="px-5 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">회원 상세 정보</h3>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                { label: '회사명', value: detailTarget.company_name },
                { label: '담당자', value: detailTarget.manager_name },
                { label: '이메일', value: detailTarget.email },
                { label: '회원 유형', value: detailTarget.role === 'BUYER' ? '완제사 (구매)' : detailTarget.role === 'SELLER' ? '원료사 (판매)' : detailTarget.role },
                { label: '가입일', value: new Date(detailTarget.created_at).toLocaleDateString('ko-KR') },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-24 text-gray-400 shrink-0">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value || '-'}</dd>
                </div>
              ))}
              <div className="flex gap-3">
                <dt className="w-24 text-gray-400 shrink-0">계정 상태</dt>
                <dd><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[detailTarget.account_status]}`}>{STATUS_LABEL[detailTarget.account_status]}</span></dd>
              </div>
            </dl>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              {detailTarget.account_status !== 'APPROVED' && (
                <button onClick={async () => { await evaluateUser(detailTarget.id, 'APPROVE'); setDetailTarget(prev => prev ? { ...prev, account_status: 'APPROVED' } : null) }}
                  disabled={!!actionId} className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium">승인</button>
              )}
              {detailTarget.account_status !== 'REJECTED' && (
                <button onClick={() => { setDetailTarget(null); setRejectTarget({ id: detailTarget.id, type: 'member' }) }}
                  className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 font-medium">반려</button>
              )}
              <button onClick={() => { setDetailTarget(null); setDeleteTarget(detailTarget) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 font-medium">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 원료 상세 모달 */}
      {productDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 my-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">원료 상세 정보</h3>
              <button onClick={() => setProductDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[productDetail.status]}`}>
                {STATUS_LABEL[productDetail.status]}
              </span>
              {productDetail.status === 'REJECTED' && productDetail.rejection_reason && (
                <span className="text-xs text-red-500">사유: {productDetail.rejection_reason}</span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                { label: '성분명', value: productDetail.name, full: true },
                { label: '공급사', value: productDetail.supplier_name || productDetail.profiles?.company_name },
                { label: '제조원', value: productDetail.manufacturer },
                { label: 'CAS No.', value: productDetail.cas_no, mono: true },
                { label: 'DMF No.', value: productDetail.dmf_no, mono: true },
                { label: '규격', value: productDetail.standard },
                { label: '금액', value: productDetail.price_info },
                { label: '담당자', value: productDetail.profiles?.manager_name },
                { label: '등록일', value: new Date(productDetail.created_at).toLocaleDateString('ko-KR') },
              ].map(({ label, value, mono, full }) => (
                <div key={label} className={full ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className={`font-medium text-gray-800 ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value || '–'}</p>
                </div>
              ))}
              {productDetail.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">비고</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{productDetail.notes}</p>
                </div>
              )}
            </dl>

            {productDetail.document_path && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">📄 {productDetail.document_path.split('/').pop()}</span>
                <button onClick={async () => {
                  const res = await fetch(`/api/products/${productDetail.id}/download`)
                  if (res.ok) {
                    const { url } = await res.json()
                    window.open(url, '_blank')
                  }
                }} className="text-xs text-blue-600 hover:underline font-medium">⬇ 다운로드</button>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              {productDetail.status !== 'APPROVED' && (
                <button onClick={() => evaluateProduct(productDetail.id, 'APPROVE')}
                  disabled={!!actionId}
                  className="px-5 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 font-semibold">
                  {actionId === productDetail.id ? '처리 중...' : '승인'}
                </button>
              )}
              {productDetail.status !== 'REJECTED' && (
                <button onClick={() => { setProductDetail(null); setRejectTarget({ id: productDetail.id, type: 'product' }) }}
                  className="px-5 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 font-medium">반려</button>
              )}
              {productDetail.status === 'APPROVED' && (
                <button onClick={() => { setRejectTarget({ id: productDetail.id, type: 'product' }); setProductDetail(null) }}
                  className="px-5 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 font-medium">승인 취소</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">회원 및 원료 등록 승인 관리</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button onClick={() => setTab('members')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'members' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            계정 승인
            {pendingMembers.length > 0 && <span className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingMembers.length}</span>}
          </button>
          <button onClick={() => setTab('manage')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'manage' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            회원 관리
            <span className="ml-2 bg-gray-400 text-white text-xs px-1.5 py-0.5 rounded-full">{members.length}</span>
          </button>
          <button onClick={() => setTab('products')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            원료 관리
            {pendingProducts.length > 0 && <span className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingProducts.length}</span>}
          </button>
          <button onClick={() => setTab('licenses')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'licenses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            허가자료
            {pendingLicenses.length > 0 && <span className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingLicenses.length}</span>}
          </button>
        </div>

        {/* ── 계정 승인 탭 ── */}
        {tab === 'members' && (
          <section>
            <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">승인 대기 ({pendingMembers.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {pendingMembers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">대기 중인 가입 신청이 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">회사명</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">담당자</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">이메일</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">가입유형</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">신청일</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingMembers.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">{m.company_name || '-'}</td>
                        <td className="px-5 py-4 text-gray-600">{m.manager_name || '-'}</td>
                        <td className="px-5 py-4 text-gray-600">{m.email || '-'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.role === 'BUYER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {m.role === 'BUYER' ? '완제사' : '원료사'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{new Date(m.created_at).toLocaleDateString('ko-KR')}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setDetailTarget(m)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 font-medium">상세</button>
                            <button onClick={() => evaluateUser(m.id, 'APPROVE')} disabled={actionId === m.id}
                              className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium">승인</button>
                            <button onClick={() => setRejectTarget({ id: m.id, type: 'member' })} disabled={actionId === m.id}
                              className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium">반려</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* ── 회원 관리 탭 ── */}
        {tab === 'manage' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                placeholder="회사명, 담당자, 이메일 검색..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
                  <button key={s} onClick={() => setMemberStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${memberStatusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s === 'ALL' ? `전체 (${members.length})` : `${STATUS_LABEL[s]} (${members.filter(m => m.account_status === s).length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">해당하는 회원이 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">회사명</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">담당자</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">이메일</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">유형</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">상태</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">가입일</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">{m.company_name || '-'}</td>
                        <td className="px-5 py-4 text-gray-600">{m.manager_name || '-'}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{m.email || '-'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.role === 'BUYER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {m.role === 'BUYER' ? '완제사' : m.role === 'SELLER' ? '원료사' : m.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[m.account_status]}`}>
                            {STATUS_LABEL[m.account_status] ?? m.account_status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{new Date(m.created_at).toLocaleDateString('ko-KR')}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setDetailTarget(m)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 font-medium">상세</button>
                            {m.account_status !== 'APPROVED' && (
                              <button onClick={() => evaluateUser(m.id, 'APPROVE')} disabled={actionId === m.id}
                                className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium">승인</button>
                            )}
                            {m.account_status !== 'REJECTED' && (
                              <button onClick={() => setRejectTarget({ id: m.id, type: 'member' })} disabled={actionId === m.id}
                                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium">반려</button>
                            )}
                            <button onClick={() => setDeleteTarget(m)} disabled={actionId === m.id}
                              className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50 font-medium">삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── 원료 관리 탭 ── */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="성분명, CAS No., 공급사 검색..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
                  <button key={s} onClick={() => setProductStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${productStatusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s === 'ALL' ? `전체 (${products.length})` : `${STATUS_LABEL[s]} (${products.filter(p => p.status === s).length})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">등록된 원료가 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">성분명</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">공급사</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">CAS No.</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">규격</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">상태</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">등록일</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-900">{p.name}</td>
                        <td className="px-5 py-4 text-gray-600">{p.supplier_name || p.profiles?.company_name || '-'}</td>
                        <td className="px-5 py-4 text-gray-500 font-mono text-xs">{p.cas_no || '-'}</td>
                        <td className="px-5 py-4">
                          {p.standard
                            ? <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">{p.standard}</span>
                            : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                            {STATUS_LABEL[p.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setProductDetail(p)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 font-medium">상세</button>
                            {p.status !== 'APPROVED' && (
                              <button onClick={() => evaluateProduct(p.id, 'APPROVE')} disabled={actionId === p.id}
                                className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium">승인</button>
                            )}
                            {p.status !== 'REJECTED' && (
                              <button onClick={() => setRejectTarget({ id: p.id, type: 'product' })} disabled={actionId === p.id}
                                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium">반려</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {/* ── 허가자료 탭 ── */}
        {tab === 'licenses' && (
          <div className="space-y-4">

            {/* 허가자료 상세 모달 */}
            {licenseDetail && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">허가자료 상세</h3>
                    <button onClick={() => setLicenseDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LICENSE_TYPE_COLORS[licenseDetail.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {licenseDetail.type}
                    </span>
                    {licenseDetail.verified
                      ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-600 text-white">✓ 검증완료</span>
                      : <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">검증 대기</span>
                    }
                    {licenseDetail.isNew && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500 text-white">NEW</span>}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">문서 제목</p>
                      <p className="font-semibold text-gray-900">{licenseDetail.title}</p>
                    </div>
                    {[
                      { label: '적용 기준', value: licenseDetail.standard },
                      { label: '적용 장비', value: licenseDetail.equipment },
                      { label: '페이지 수', value: `${licenseDetail.pages}p` },
                      { label: '가격', value: `₩ ${licenseDetail.price.toLocaleString()}` },
                      { label: '등록자', value: licenseDetail.submittedBy ?? '-' },
                      { label: '등록일', value: licenseDetail.submittedAt },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="font-medium text-gray-800 text-sm">{value}</p>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1">태그</p>
                      <div className="flex flex-wrap gap-1">
                        {licenseDetail.tags.map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </dl>

                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button onClick={() => deleteL(licenseDetail.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-red-50 hover:text-red-500 font-medium">
                      삭제
                    </button>
                    <button onClick={() => toggleLicenseVerify(licenseDetail.id)}
                      className={`px-5 py-2 text-sm rounded-lg font-semibold transition-colors ${licenseDetail.verified ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {licenseDetail.verified ? '검증 취소' : '검증 완료 처리'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 검색 + 필터 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={licenseSearch} onChange={e => setLicenseSearch(e.target.value)}
                placeholder="문서명, 유형, 등록자 검색..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['ALL', 'PENDING', 'VERIFIED'] as const).map(f => (
                  <button key={f} onClick={() => setLicenseFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${licenseFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {f === 'ALL' ? `전체 (${licenses.length})` : f === 'PENDING' ? `대기 (${pendingLicenses.length})` : `검증완료 (${licenses.filter(d => d.verified).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredLicenses.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">해당하는 자료가 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">문서명</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">유형</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">기준</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">등록자</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">가격</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">상태</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLicenses.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm line-clamp-1 max-w-xs">{d.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{d.pages}p · {d.equipment}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LICENSE_TYPE_COLORS[d.type] ?? 'bg-gray-100 text-gray-600'}`}>
                            {d.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{d.standard}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-sm">{d.submittedBy ?? '-'}</td>
                        <td className="px-5 py-4 text-gray-800 font-medium text-sm">₩{(d.price / 10000).toFixed(0)}만</td>
                        <td className="px-5 py-4">
                          {d.verified
                            ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">검증완료</span>
                            : <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">검증 대기</span>
                          }
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setLicenseDetail(d)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 font-medium">상세</button>
                            <button onClick={() => toggleLicenseVerify(d.id)}
                              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${d.verified ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                              {d.verified ? '취소' : '검증'}
                            </button>
                            <button onClick={() => deleteL(d.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100 font-medium">삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
