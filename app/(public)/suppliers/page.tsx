import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

interface SearchParams { q?: string; type?: string }

const COMPANY_TYPES = ['원료의약품 합성', '원료의약품 수입', '원료의약품 도매', '화장품원료 합성', '화장품원료 수입', '화장품원료 도매']

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 승인된 SELLER 목록 조회
  let query = supabase
    .from('profiles')
    .select('id, company_name, manager_name, company_type, role')
    .eq('role', 'SELLER')
    .eq('account_status', 'APPROVED')
    .order('company_name', { ascending: true })

  if (params.q) {
    query = query.ilike('company_name', `%${params.q}%`)
  }
  if (params.type) {
    query = query.contains('company_type', [params.type])
  }

  const { data: sellers } = await query

  // 각 공급사의 승인된 원료 수 조회
  const { data: productCounts } = await supabase
    .from('products')
    .select('seller_id')
    .eq('status', 'APPROVED')

  const countMap: Record<string, number> = {}
  productCounts?.forEach(p => {
    countMap[p.seller_id] = (countMap[p.seller_id] ?? 0) + 1
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">공급사</h1>
        <p className="text-gray-500 text-sm">등록된 원료의약품 공급업체 목록입니다.</p>
      </div>

      {/* 검색 필터 */}
      <form method="get" className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="회사명 검색..."
          className="flex-1 min-w-48 px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="type"
          defaultValue={params.type}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 유형</option>
          {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit"
          className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">
          검색
        </button>
        {(params.q || params.type) && (
          <Link href="/suppliers" className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 flex items-center">
            초기화
          </Link>
        )}
      </form>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-4">
        총 <span className="font-semibold text-gray-800">{sellers?.length ?? 0}</span>개 공급사
      </p>

      {/* 공급사 카드 목록 */}
      {(!sellers || sellers.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center text-gray-400 text-sm">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map(seller => {
            const types = Array.isArray(seller.company_type) ? seller.company_type : []
            const productCount = countMap[seller.id] ?? 0
            return (
              <Link key={seller.id} href={`/suppliers/${seller.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                    {(seller.company_name ?? '?')[0]}
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    원료 {productCount}개
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-700 transition-colors">
                  {seller.company_name ?? '-'}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{seller.manager_name ?? '-'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {types.map((t: string) => (
                    <span key={t} className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">상세 정보 보기</span>
                  <span className="text-blue-500 text-sm group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
