import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type ApiRow = Database['public']['Tables']['apis']['Row'] & {
  companies: Database['public']['Tables']['companies']['Row'] | null
}
type DataRoomRow = Database['public']['Tables']['data_room']['Row']

export default async function ApiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: api } = await supabase
    .from('apis')
    .select('*, companies(*)')
    .eq('id', id)
    .single() as { data: ApiRow | null }

  if (!api) notFound()

  const { data: documents } = await supabase
    .from('data_room')
    .select('id, document_type, title, description, price, currency, access_type, sample_file_path')
    .eq('api_id', id)
    .eq('is_active', true) as { data: Pick<DataRoomRow, 'id' | 'document_type' | 'title' | 'description' | 'price' | 'currency' | 'access_type' | 'sample_file_path'>[] | null }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{api.generic_name}</h1>
            {api.brand_name && <p className="text-gray-400 text-sm">{api.brand_name}</p>}
          </div>
          <div className="flex gap-2">
            {api.standards.map((s: string) => (
              <span key={s} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { label: 'CAS No.', value: api.cas_number },
            { label: 'DMF No.', value: api.dmf_number },
            { label: 'DMF Type', value: api.dmf_type },
            { label: '치료 분류', value: api.therapeutic_category },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-medium text-gray-800">{value ?? '–'}</p>
            </div>
          ))}
        </div>

        {api.description && (
          <p className="mt-6 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-6">
            {api.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 데이터룸 */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">허가 자료 (Data Room)</h2>
          {documents?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              등록된 자료가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {documents?.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        {doc.document_type}
                      </span>
                      <span className="font-medium text-sm">{doc.title}</span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-gray-400">{doc.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    {doc.access_type === 'FREE' ? (
                      <span className="text-green-600 text-xs font-semibold">무료</span>
                    ) : (
                      <span className="text-gray-800 text-sm font-semibold">
                        {doc.price?.toLocaleString()} {doc.currency}
                      </span>
                    )}
                    <div className="mt-1">
                      {user ? (
                        <Link
                          href={`/api/data-room/${doc.id}/download`}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          다운로드 →
                        </Link>
                      ) : (
                        <Link href="/login" className="text-gray-400 text-xs hover:underline">
                          로그인 필요
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 공급사 정보 + 문의 버튼 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">공급사 정보</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="font-semibold text-gray-900 mb-1">{api.companies?.name}</p>
            <p className="text-xs text-gray-400 mb-4">{api.companies?.country}</p>
            {api.companies?.is_gmp_certified && (
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                ✓ GMP 인증
              </span>
            )}
            <div className="mt-6">
              {user ? (
                <Link
                  href={`/dashboard/buyer/inquiries/new?api_id=${api.id}&seller_company=${api.company_id}`}
                  className="block w-full text-center bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-sm"
                >
                  문의하기
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-sm"
                >
                  로그인 후 문의하기
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
