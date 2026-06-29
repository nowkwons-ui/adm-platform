import Link from 'next/link'

export default function AccountRejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 space-y-4">
          <div className="text-5xl mb-2">🚫</div>
          <h1 className="text-xl font-bold text-gray-900">계정 접근이 제한되었습니다</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            관리자에 의해 계정이 반려되었습니다.<br />
            문의사항은 아래 이메일로 연락해주세요.
          </p>
          <a href="mailto:sbkwon@kukjeon.co.kr"
            className="inline-block text-blue-700 font-medium text-sm hover:underline">
            sbkwon@kukjeon.co.kr
          </a>
          <div className="pt-2">
            <Link href="/"
              className="inline-block bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
