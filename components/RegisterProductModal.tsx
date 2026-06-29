'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onSuccess?: () => void
}

const STANDARDS = ['USP', 'EP', 'BP', 'KHP', 'JP', 'ICH', '기타']

export default function RegisterProductModal({ onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: '',
    cas_no: '',
    dmf_no: '',
    manufacturer: '',
    supplier_name: '',
    standard: '',
    price_amount: '',
    price_currency: 'USD',
    notes: '',
  })

  const openModal = async () => {
    if (!checked) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const r = user?.app_metadata?.role as string ?? null
      setRole(r)
      setUid(user?.id ?? null)
      setChecked(true)
    }
    setOpen(true)
    setSuccess(false)
    setError('')
  }

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('성분명을 입력해주세요.'); return }
    if (!uid) { setError('로그인이 필요합니다.'); return }
    setLoading(true); setError('')

    // 첨부파일 업로드 (서비스 롤 API 라우트 경유)
    let document_path: string | null = null
    if (docFile) {
      const fd = new FormData()
      fd.append('file', docFile)
      fd.append('uid', uid)
      const uploadRes = await fetch('/api/products/upload-document', {
        method: 'POST',
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        setError('파일 업로드 실패: ' + uploadData.error)
        setLoading(false)
        return
      }
      document_path = uploadData.path
    }

    let res: Response
    let data: { error?: string } = {}
    try {
      res = await fetch('/api/products/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          name: form.name.trim(),
          cas_no: form.cas_no.trim() || null,
          dmf_no: form.dmf_no.trim() || null,
          manufacturer: form.manufacturer.trim() || null,
          supplier_name: form.supplier_name.trim() || null,
          standard: form.standard || null,
          price_info: form.price_amount.trim() ? `${form.price_currency} ${form.price_amount}/kg` : null,
          notes: form.notes.trim() || null,
          document_path,
        }),
      })
      const text = await res.text()
      try { data = JSON.parse(text) } catch { data = {} }
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
      return
    }
    setLoading(false)

    if (!res.ok) { setError(data.error ?? '등록 실패'); return }
    setSuccess(true)
    setForm({ name: '', cas_no: '', dmf_no: '', manufacturer: '', supplier_name: '', standard: '', price_amount: '', price_currency: 'USD', notes: '' })
    setDocFile(null)
    onSuccess?.()
  }

  // 로그인 안 됐거나 SELLER/ADMIN 아니면 버튼 숨김
  if (checked && role !== 'SELLER' && role !== 'ADMIN') return null

  return (
    <>
      <button onClick={openModal}
        className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap">
        + 원료 등록
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl space-y-5 my-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">원료 등록 신청</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {success ? (
              <div className="space-y-4 text-center py-6">
                <div className="text-5xl">✅</div>
                <p className="font-semibold text-gray-900 text-lg">등록 신청이 완료되었습니다.</p>
                <p className="text-sm text-gray-500">관리자 승인 후 원료 검색 목록에 공개됩니다.</p>
                <button onClick={() => { setOpen(false); setSuccess(false) }}
                  className="px-6 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

                {/* 성분명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성분명 (Generic Name) <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    required placeholder="예: Ibuprofen"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* CAS No. + DMF No. */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CAS No.</label>
                    <input type="text" value={form.cas_no} onChange={e => set('cas_no', e.target.value)}
                      placeholder="예: 15687-27-1"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DMF 번호</label>
                    <input type="text" value={form.dmf_no} onChange={e => set('dmf_no', e.target.value)}
                      placeholder="예: DMF-12345"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                  </div>
                </div>

                {/* 공급사 + 제조원 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">공급사</label>
                    <input type="text" value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)}
                      placeholder="공급사명"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">제조원</label>
                    <input type="text" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)}
                      placeholder="제조사명"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* 규격 + 금액 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">관리 규격</label>
                    <select value={form.standard} onChange={e => set('standard', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">선택</option>
                      {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">kg당 금액</label>
                    <div className="flex gap-1">
                      <select value={form.price_currency} onChange={e => set('price_currency', e.target.value)}
                        className="w-20 px-2 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {['USD','EUR','KRW','JPY','CNY'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <input type="number" min="0" step="0.01" value={form.price_amount} onChange={e => set('price_amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">/kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 비고 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="추가 설명, 특이사항 등을 입력하세요."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

                {/* 첨부문서 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">첨부 문서</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                    <input type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={e => setDocFile(e.target.files?.[0] ?? null)}
                      className="hidden" id="doc-upload" />
                    <label htmlFor="doc-upload" className="cursor-pointer">
                      {docFile ? (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ {docFile.name}
                          <span className="ml-2 text-xs text-gray-400">({(docFile.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          <span className="text-blue-600 font-medium">파일 선택</span> 또는 드래그&드롭
                          <p className="text-xs mt-1">PDF, Word, Excel, 이미지 (최대 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {docFile && (
                    <button type="button" onClick={() => setDocFile(null)}
                      className="mt-1 text-xs text-red-400 hover:text-red-600">
                      파일 제거
                    </button>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
                  등록 후 관리자 검토를 거쳐 승인되면 원료 검색 목록에 공개됩니다.
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={() => setOpen(false)}
                    className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">취소</button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-2.5 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 font-semibold">
                    {loading ? '등록 중...' : '등록 신청'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
