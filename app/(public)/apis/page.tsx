import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

interface SearchParams { q?: string; standard?: string; dmf?: string }

type ApiRow = Database['public']['Tables']['apis']['Row'] & {
  companies: Pick<Database['public']['Tables']['companies']['Row'], 'name' | 'country' | 'is_gmp_certified'> | null
}

export default async function ApisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('apis')
    .select('*, companies(name, country, is_gmp_certified)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.ilike('generic_name', `%${params.q}%`)
  }
  if (params.standard) {
    query = query.contains('standards', [params.standard])
  }
  if (params.dmf) {
    query = query.ilike('dmf_number', `%${params.dmf}%`)
  }

  const { data: apis } = await query.limit(50) as { data: ApiRow[] | null }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">원료의약품(API) 검색</h1>
        <p className="text-gray-500 text-sm">성분명, DMF 번호, 관리 규격으로 검색하세요.</p>
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
          {['USP', 'EP', 'BP', 'KHP', 'JP'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          name="dmf"
          defaultValue={params.dmf}
          placeholder="DMF No."
          className="w-40 px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 결과 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4 text-left">성분명</th>
              <th className="px-6 py-4 text-left">CAS No.</th>
              <th className="px-6 py-4 text-left">규격</th>
              <th className="px-6 py-4 text-left">DMF No.</th>
              <th className="px-6 py-4 text-left">공급사</th>
              <th className="px-6 py-4 text-left">GMP</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apis?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {apis?.map((api) => (
              <tr key={api.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{api.generic_name}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{api.cas_number ?? '–'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {api.standards.map((s: string) => (
                      <span key={s} className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{api.dmf_number ?? '–'}</td>
                <td className="px-6 py-4 text-gray-700">
                  {api.companies?.name}
                </td>
                <td className="px-6 py-4">
                  {api.companies?.is_gmp_certified ? (
                    <span className="text-green-600 text-xs font-semibold">✓ GMP</span>
                  ) : (
                    <span className="text-gray-300 text-xs">–</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/apis/${api.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                  >
                    상세 보기 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
