'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const INITIAL_DOCS = [
  { id: 1, title: '발사르탄 니트로사민 유전독성 불순물 MV 보고서', type: 'MV', standard: 'MFDS', equipment: 'HPLC', pages: 45, price: 3000000, verified: true, isNew: false, tags: ['니트로사민', 'NDMA', '불순물'] },
  { id: 2, title: '메트포르민 CTD 모듈 3 완성본 (ICH Q3A 기반)', type: 'CTD', standard: 'MFDS', equipment: 'LC-MS/MS', pages: 120, price: 5500000, verified: true, isNew: false, tags: ['CTD', 'ICH Q3A', '당뇨'] },
  { id: 3, title: '고성능 UV 흡광도 별규시험법 SOP 표준 양식', type: 'SOP', standard: 'USP', equipment: 'UV-Vis', pages: 18, price: 480000, verified: false, isNew: true, tags: ['SOP', '별규시험법', 'UV'] },
  { id: 4, title: '세파클러 용출 시험법 밸리데이션 프로토콜', type: 'Protocol', standard: 'EP', equipment: 'HPLC', pages: 32, price: 1200000, verified: true, isNew: true, tags: ['용출시험', '항생제', '밸리데이션'] },
  { id: 5, title: '아토르바스타틴 CV 적격성 평가 보고서 (IQ/OQ/PQ)', type: 'CV', standard: 'MFDS', equipment: 'HPLC', pages: 67, price: 2200000, verified: true, isNew: false, tags: ['CV', '적격성평가', '스타틴'] },
  { id: 6, title: '아목시실린 원료 CTD Module 2 품질총괄보고서', type: 'CTD', standard: 'MFDS', equipment: 'GC', pages: 88, price: 4000000, verified: false, isNew: true, tags: ['CTD', '항생제', '원료'] },
  { id: 7, title: 'GC-Headspace 잔류용매 시험법 MV 완성 패키지', type: 'MV', standard: 'USP', equipment: 'GC', pages: 53, price: 1800000, verified: true, isNew: false, tags: ['잔류용매', 'ICH Q3C', 'Headspace'] },
  { id: 8, title: '니트로사민류 위험평가 SOP 및 체크리스트', type: 'SOP', standard: 'MFDS', equipment: 'LC-MS/MS', pages: 24, price: 650000, verified: true, isNew: true, tags: ['니트로사민', '위험평가', 'NDSRI'] },
  { id: 9, title: 'USP <1> 주사제 입자 적격성 평가 프로토콜', type: 'Protocol', standard: 'USP', equipment: 'Light Obscuration', pages: 29, price: 900000, verified: false, isNew: false, tags: ['주사제', '입자시험', 'USP'] },
  { id: 10, title: '레보티록신 함량 균일성 MV (EP 2.9.40 기반)', type: 'MV', standard: 'EP', equipment: 'HPLC', pages: 41, price: 1500000, verified: true, isNew: false, tags: ['함량균일성', '갑상선', 'EP'] },
]

const DOC_TYPES = ['MV', 'CTD', 'CV', 'SOP', 'Protocol']
const STANDARDS = ['MFDS', 'USP', 'EP']
const HOT_TAGS = ['#니트로사민류_MV', '#적격성평가_프로토콜', '#SOP_양식', '#별규시험법']

const TYPE_COLORS: Record<string, string> = {
  MV: 'bg-blue-100 text-blue-700',
  CTD: 'bg-purple-100 text-purple-700',
  CV: 'bg-teal-100 text-teal-700',
  SOP: 'bg-orange-100 text-orange-700',
  Protocol: 'bg-green-100 text-green-700',
}

type Doc = typeof INITIAL_DOCS[0]

const EMPTY_FORM = { title: '', type: 'MV', standard: 'MFDS', equipment: '', pages: '', price: '', tags: '' }

export default function LicenseMarketPage() {
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS)
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(6000000)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true)
        setIsAdmin(data.user.app_metadata?.role === 'ADMIN')
      }
    })
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const toggleVerify = (id: number) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, verified: !d.verified } : d))
    showToast('검증 상태가 변경되었습니다.')
  }

  const handleRegister = () => {
    if (!form.title || !form.equipment || !form.pages || !form.price) {
      showToast('모든 항목을 입력해 주세요.')
      return
    }
    const newDoc: Doc = {
      id: Date.now(),
      title: form.title,
      type: form.type,
      standard: form.standard,
      equipment: form.equipment,
      pages: Number(form.pages),
      price: Number(form.price),
      verified: false,
      isNew: true,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    setDocs(prev => [newDoc, ...prev])
    setForm(EMPTY_FORM)
    setShowModal(false)
    showToast('자료가 등록되었습니다. 관리자 검증 후 게시됩니다.')
  }

  const toggleType = (t: string) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const toggleStandard = (s: string) =>
    setSelectedStandards(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const filtered = useMemo(() => {
    return docs.filter(doc => {
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) &&
        !doc.tags.some(t => t.includes(search))) return false
      if (selectedTypes.length && !selectedTypes.includes(doc.type)) return false
      if (selectedStandards.length && !selectedStandards.includes(doc.standard)) return false
      if (doc.price > maxPrice) return false
      return true
    })
  }, [docs, search, selectedTypes, selectedStandards, maxPrice])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 토스트 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">허가 자료 등록</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">문서 제목 *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="예: 발사르탄 니트로사민 MV 보고서"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">문서 유형 *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">적용 기준 *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    value={form.standard}
                    onChange={e => setForm(f => ({ ...f, standard: e.target.value }))}
                  >
                    {STANDARDS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">적용 장비 *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="예: HPLC"
                    value={form.equipment}
                    onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">페이지 수 *</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="예: 45"
                    value={form.pages}
                    onChange={e => setForm(f => ({ ...f, pages: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">가격 (원) *</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="예: 3000000"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">태그 (쉼표로 구분)</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="예: 니트로사민, NDMA, 불순물"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                등록 신청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 히어로 섹션 */}
      <div className="bg-white border-b border-gray-200 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">IP Market</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">허가마켓</h1>
          <p className="text-gray-500 text-sm mb-6">
            RA/QC 팀을 위한 MV · CTD · SOP 등 고품질 허가 자료를 탐색하고 구매하세요.
          </p>
          <div className="relative max-w-2xl mx-auto mb-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="문서명, 성분명, 키워드로 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {HOT_TAGS.map(tag => (
              <button key={tag} onClick={() => setSearch(tag.replace('#', '').replace(/_/g, ' '))}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">

        {/* 사이드바 */}
        <aside className="w-56 shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">문서 유형</p>
            <div className="space-y-2">
              {DOC_TYPES.map(t => (
                <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} className="w-4 h-4 accent-blue-600 rounded" />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{t}</span>
                  <span className="ml-auto text-xs text-gray-400">{docs.filter(d => d.type === t).length}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">적용 기준</p>
            <div className="space-y-2">
              {STANDARDS.map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={selectedStandards.includes(s)} onChange={() => toggleStandard(s)} className="w-4 h-4 accent-blue-600 rounded" />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{s}</span>
                  <span className="ml-auto text-xs text-gray-400">{docs.filter(d => d.standard === s).length}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">최대 가격</p>
            <input type="range" min={0} max={6000000} step={100000} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-gray-500 mt-1.5">
              <span>₩0</span>
              <span className="font-semibold text-blue-600">₩{maxPrice.toLocaleString()}</span>
            </div>
          </div>

          {(selectedTypes.length > 0 || selectedStandards.length > 0 || maxPrice < 6000000) && (
            <button onClick={() => { setSelectedTypes([]); setSelectedStandards([]); setMaxPrice(6000000) }}
              className="w-full text-xs text-gray-500 hover:text-red-500 transition-colors underline">
              필터 초기화
            </button>
          )}
        </aside>

        {/* 카드 그리드 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              총 <span className="font-semibold text-gray-800">{filtered.length}</span>건
              {isAdmin && (
                <span className="ml-2 text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                  관리자 모드
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  자료 등록
                </button>
              )}
              <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                <option>최신순</option>
                <option>가격 낮은순</option>
                <option>가격 높은순</option>
              </select>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              보유하신 허가 자료를 등록하려면 <a href="/login" className="font-semibold underline ml-1">로그인</a>해 주세요.
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-24 flex flex-col items-center gap-3 text-center">
              <div className="text-4xl">🔍</div>
              <p className="font-semibold text-gray-700">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-400">다른 키워드나 필터를 시도해 보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(doc => (
                <DocCard key={doc.id} doc={doc} isAdmin={isAdmin} onToggleVerify={toggleVerify} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DocCard({ doc, isAdmin, onToggleVerify }: {
  doc: Doc
  isAdmin: boolean
  onToggleVerify: (id: number) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 transition-all relative">

      {/* 관리자 검증 버튼 */}
      {isAdmin && (
        <button
          onClick={() => onToggleVerify(doc.id)}
          title={doc.verified ? '검증 취소' : '검증 완료 처리'}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm border ${
            doc.verified
              ? 'bg-blue-600 border-blue-600 text-white hover:bg-red-500 hover:border-red-500'
              : 'bg-white border-gray-300 text-gray-400 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </button>
      )}

      {/* 뱃지 */}
      <div className="flex items-center gap-2 flex-wrap pr-8">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[doc.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {doc.type}
        </span>
        {doc.verified && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
            ✓ 검증완료
          </span>
        )}
        {!doc.verified && isAdmin && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
            미검증
          </span>
        )}
        {doc.isNew && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-500 text-white">NEW</span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{doc.title}</h3>

      {/* 메타 */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6z" />
          </svg>
          {doc.pages}p
        </span>
        <span>·</span>
        <span>{doc.equipment}</span>
        <span>·</span>
        <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{doc.standard}</span>
      </div>

      {/* 태그 */}
      <div className="flex flex-wrap gap-1">
        {doc.tags.map(tag => (
          <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">#{tag}</span>
        ))}
      </div>

      {/* 가격 + 버튼 */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-base font-bold text-gray-900 mb-2">₩ {doc.price.toLocaleString()}</p>
        <div className="flex gap-2">
          <button className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            샘플 보기
          </button>
          <button className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            장바구니
          </button>
        </div>
      </div>
    </div>
  )
}
