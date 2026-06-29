import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: seller } = await supabase
    .from('profiles')
    .select('id, company_name, manager_name, company_type, role, account_status')
    .eq('id', id)
    .eq('role', 'SELLER')
    .eq('account_status', 'APPROVED')
    .single()

  if (!seller) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, cas_no, dmf_no, standard, price_info, notes')
    .eq('seller_id', id)
    .eq('status', 'APPROVED')
    .order('name', { ascending: true })

  const types = Array.isArray(seller.company_type) ? seller.company_type : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/suppliers" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        ← 공급사 목록
      </Link>

      {/* 공급사 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
            {(seller.company_name ?? '?')[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{seller.company_name}</h1>
            <p className="text-gray-500 text-sm mb-3">담당자: {seller.manager_name ?? '-'}</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t: string) => (
                <span key={t} className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-blue-700">{products?.length ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">등록 원료</p>
          </div>
        </div>
      </div>

      {/* 등록 원료 목록 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">등록 원료 목록</h2>
        {(!products || products.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
            등록된 원료가 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4 text-left">성분명</th>
                  <th className="px-6 py-4 text-left">CAS No.</th>
                  <th className="px-6 py-4 text-left">DMF No.</th>
                  <th className="px-6 py-4 text-left">규격</th>
                  <th className="px-6 py-4 text-left">금액 (USD/kg)</th>
                  <th className="px-6 py-4 text-left">비고</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.cas_no ?? '–'}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.dmf_no ?? '–'}</td>
                    <td className="px-6 py-4">
                      {p.standard
                        ? <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">{p.standard}</span>
                        : '–'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-700">{p.price_info ?? '–'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs max-w-[180px] truncate">{p.notes ?? '–'}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/apis/${p.id}`} className="text-blue-600 text-xs font-medium hover:text-blue-800">
                        상세 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
