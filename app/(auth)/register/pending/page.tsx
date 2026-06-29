import Link from 'next/link'

export default function RegisterPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 space-y-4">
          <div className="text-5xl mb-2">📬</div>
          <h1 className="text-xl font-bold text-gray-900">가입 신청이 완료되었습니다</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            관리자가 제출하신 정보를 검토한 후<br />
            승인 완료 시 이메일로 안내드립니다.<br />
            보통 <b>1~2 영업일</b> 내에 처리됩니다.
          </p>
          <Link href="/"
            className="inline-block mt-4 bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
