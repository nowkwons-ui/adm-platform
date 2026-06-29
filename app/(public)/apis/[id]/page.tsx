import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DownloadButton from '@/components/DownloadButton'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: product } = await supabase
    .from('products')
    .select('id, name, cas_no, dmf_no, manufacturer, supplier_name, standard, price_info, notes, document_path, status, created_at, profiles(company_name, manager_name)')
    .eq('id', id)
    .eq('status', 'APPROVED')
    .single()

  if (!product) notFound()

  const profile = product.profiles as { company_name: string | null; manager_name: string | null } | null
  const supplierName = product.supplier_name || profile?.company_name || '–'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/apis" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        ← 목록으로
      </Link>

      {/* 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{supplierName}</p>
          </div>
          <div className="flex items-center gap-2">
            {product.standard && (
              <span className="bg-blue-100 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full">
                {product.standard}
              </span>
            )}
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">승인됨</span>
          </div>
        </div>

        {/* 기본 정보 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 border-t border-gray-100 pt-6">
          <InfoField label="성분명 (Generic Name)" value={product.name} large />
          <InfoField label="CAS No." value={product.cas_no} mono />
          <InfoField label="DMF 번호" value={product.dmf_no} mono />
          <InfoField label="공급사" value={supplierName} />
          <InfoField label="제조원" value={product.manufacturer} />
          <InfoField label="관리 규격" value={product.standard} badge />
          <InfoField label="kg당 금액" value={product.price_info} highlight />
          <InfoField label="등록일" value={new Date(product.created_at).toLocaleDateString('ko-KR')} />
          {profile?.manager_name && <InfoField label="담당자" value={profile.manager_name} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 비고 + 첨부문서 */}
        <div className="md:col-span-2 space-y-5">
          {/* 비고 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">비고</h2>
            {product.notes ? (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{product.notes}</p>
            ) : (
              <p className="text-sm text-gray-300">내용 없음</p>
            )}
          </div>

          {/* 첨부문서 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">첨부 문서</h2>
            {product.document_path ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-lg shrink-0">
                    📄
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {product.document_path.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">첨부 파일</p>
                  </div>
                </div>
                <DownloadButton productId={product.id} />
              </div>
            ) : (
              <p className="text-sm text-gray-300">첨부된 문서가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 공급사 카드 */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">공급사 정보</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">회사명</p>
                <p className="font-semibold text-gray-900 mt-0.5">{supplierName}</p>
              </div>
              {product.manufacturer && (
                <div>
                  <p className="text-xs text-gray-400">제조원</p>
                  <p className="font-medium text-gray-800 mt-0.5">{product.manufacturer}</p>
                </div>
              )}
              {profile?.manager_name && (
                <div>
                  <p className="text-xs text-gray-400">담당자</p>
                  <p className="font-medium text-gray-800 mt-0.5">{profile.manager_name}</p>
                </div>
              )}
              {product.price_info && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 mt-2">
                  <p className="text-xs text-blue-500 mb-1">kg당 금액</p>
                  <p className="text-lg font-bold text-blue-700">{product.price_info}</p>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Link href="/login"
                className="block w-full text-center bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-sm">
                문의하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, mono, large, badge, highlight }: {
  label: string
  value: string | null | undefined
  mono?: boolean
  large?: boolean
  badge?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {badge && value ? (
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded">{value}</span>
      ) : highlight && value ? (
        <p className="text-base font-bold text-blue-700">{value}</p>
      ) : (
        <p className={`font-medium text-gray-800 ${large ? 'text-base' : 'text-sm'} ${mono ? 'font-mono text-xs' : ''}`}>
          {value || '–'}
        </p>
      )}
    </div>
  )
}
