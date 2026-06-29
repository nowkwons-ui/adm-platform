import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [{ count: apiCount }, { count: companyCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'SELLER').eq('account_status', 'APPROVED'),
  ])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '600px' }}>
        {/* 배경 이미지 — 전체 표시 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kukjeon.jpg"
          alt="국전약품 건물"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {/* 가벼운 그라데이션 오버레이 — 하단 텍스트 가독성용 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 10 }} className="max-w-4xl mx-auto text-center w-full px-4 py-28">
          <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-4"
             style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            API Digital Marketplace
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            원료의약품(API) 및<br />
            <span className="text-blue-300">허가 데이터</span> 전문 중개 플랫폼
          </h1>
          <p className="text-gray-200 text-lg mb-10 max-w-2xl mx-auto"
             style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            완제사와 원료사를 연결합니다. DMF, CTD, 분석법 밸리데이션 자료를 안전하게 검색하고 거래하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apis"
              className="bg-white text-blue-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              원료 검색하기
            </Link>
            <Link
              href="/register"
              className="border border-white/60 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              공급사 등록
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: '등록 원료', value: apiCount ?? 0 },
            { label: '공급사', value: companyCount ?? 0 },
            { label: '허가 자료', value: '–' },
            { label: '성사 매칭', value: '–' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-blue-700">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">왜 ADM인가요?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🔍',
              title: '무료 원료 검색',
              desc: 'CAS No., DMF 번호, 관리 규격(USP/EP/KHP)으로 전 세계 원료를 즉시 검색',
            },
            {
              icon: '📁',
              title: '데이터룸',
              desc: 'MV, CTD, 불순물 평가서 등 허가 자료를 안전하게 거래. 샘플 미리보기 제공',
            },
            {
              icon: '🤝',
              title: '1:1 매칭',
              desc: '완제사 ↔ 원료사 직접 문의. 상담 → 매칭 → 계약까지 플랫폼 안에서 관리',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-50 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">지금 바로 시작하세요</h2>
        <p className="text-gray-500 mb-8">원료 검색은 회원가입 없이도 무료로 이용할 수 있습니다.</p>
        <Link
          href="/apis"
          className="bg-blue-700 text-white px-10 py-3.5 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
        >
          원료 목록 보기 →
        </Link>
      </section>
    </div>
  )
}
