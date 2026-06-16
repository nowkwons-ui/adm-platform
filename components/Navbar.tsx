'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-700">ADM</span>
          <span className="text-xs text-gray-400 hidden sm:block">API Digital Marketplace</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/apis" className="text-gray-600 hover:text-blue-700 transition-colors">원료 검색</Link>
          <Link href="/suppliers" className="text-gray-600 hover:text-blue-700 transition-colors">공급사</Link>

          {user ? (
            <>
              <Link href="/dashboard/buyer/inquiries" className="text-gray-600 hover:text-blue-700 transition-colors">
                내 문의
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-700 transition-colors">로그인</Link>
              <Link
                href="/register"
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
