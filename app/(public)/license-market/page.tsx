export default function LicenseMarketPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">허가마켓</h1>
        <p className="text-gray-500 text-sm">DMF, CTD, 분석법 밸리데이션 등 허가 자료를 거래하는 공간입니다.</p>
      </div>

      {/* 준비 중 */}
      <div className="bg-white rounded-2xl border border-gray-200 py-28 flex flex-col items-center justify-center gap-5 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl">
          📋
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800 mb-2">서비스 준비 중</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            허가마켓 서비스는 현재 준비 중입니다.<br />
            DMF, CTD, 분석법 밸리데이션 등 허가 자료를<br />
            안전하게 거래할 수 있는 공간을 곧 오픈합니다.
          </p>
        </div>
        <div className="flex gap-6 mt-2 text-sm text-gray-400">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📄</span>
            <span>DMF</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📦</span>
            <span>CTD</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🔬</span>
            <span>분석법 밸리데이션</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🧪</span>
            <span>불순물 평가서</span>
          </div>
        </div>
      </div>
    </div>
  )
}
