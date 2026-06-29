import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import RegisterProductModal from '@/components/RegisterProductModal'

interface SearchParams { q?: string; standard?: string }

function formatPrice(raw: string): string {
  // 이미 통화 코드 포함된 경우 그대로 반환
  if (/^[A-Z]{3}\s/.test(raw)) return raw
  // 숫자만 있는 경우 USD/kg 추가
  if (/^\d/.test(raw)) return `USD ${raw}${raw.includes('/') ? '' : '/kg'}`
  return raw
}

export default async function ApisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let query = supabase
    .from('products')
    .select('id, name, cas_no, dmf_no, manufacturer, supplier_name, standard, price_info, notes, profiles(company_name)')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })

  if (params.q) query = query.ilike('name', `%${params.q}%`)
  if (params.standard) query = query.eq('standard', params.standard)

  const { data: products } = await query.limit(100)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">원료의약품(API) 검색</h1>
          <p className="text-gray-500 text-sm">성분명, 관리 규격으로 검색하세요.</p>
        </div>
        <RegisterProductModal />
      </div>

      {/* 검색 폼 */}
      <form method="get" className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="성분명 (Generic Name)"
          className="flex-1 min-w-48 px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="standard"
          defaultValue={params.standard}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 규격</option>
          {['USP', 'EP', 'BP', 'KHP', 'JP', 'ICH', '기타'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit"
          className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">
          검색
        </button>
      </form>

      {/* 결과 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-4 text-left whitespace-nowrap">성분명</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">CAS No.</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">DMF No.</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">공급사</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">제조원</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">규격</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">금액 (USD/kg)</th>
              <th className="px-5 py-4 text-left whitespace-nowrap">비고</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!products || products.length === 0) ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const profile = p.profiles as { company_name: string | null } | null
                return (
                  <tr key={p.id} className="hover:bg-blue-50 transition-colors cursor-pointer group">
                    <td className="px-5 py-4 font-semibold text-blue-700 whitespace-nowrap group-hover:underline">
                      {p.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">{p.cas_no ?? '–'}</td>
                    <td className="px-5 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">{p.dmf_no ?? '–'}</td>
                    <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{p.supplier_name || profile?.company_name || '–'}</td>
                    <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{p.manufacturer ?? '–'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {p.standard ? (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">{p.standard}</span>
                      ) : '–'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {p.price_info ? (
                        <span className="font-semibold text-blue-700">{formatPrice(p.price_info)}</span>
                      ) : '–'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs max-w-[160px] truncate">{p.notes ?? '–'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link href={`/apis/${p.id}`}
                        className="text-blue-600 text-xs font-medium hover:text-blue-800">
                        상세 보기 →
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
