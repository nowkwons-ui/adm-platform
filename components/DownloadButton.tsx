'use client'

import { useState } from 'react'

export default function DownloadButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/download`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '다운로드 실패')
        return
      }
      const { url, filename } = await res.json()
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank'
      a.click()
    } catch {
      setError('다운로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-right">
      <button onClick={handleDownload} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium transition-colors whitespace-nowrap">
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            다운로드 중...
          </>
        ) : (
          <>⬇ 다운로드</>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
