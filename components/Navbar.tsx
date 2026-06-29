'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setRole((data.user?.app_metadata?.role as string) ?? null)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isAdmin = role === 'ADMIN'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Logo.jpg"
            alt="국전약품"
            width={140}
            height={52}
            className="object-contain"
          />
          <span className="text-sm text-gray-400 hidden lg:block">API Digital Marketplace</span>
        </Link>

        <div className="flex items-center gap-8 text-sm font-medium">
          <Link href="/apis" className="text-gray-600 hover:text-blue-700 transition-colors">원료 검색</Link>
          <Link href="/suppliers" className="text-gray-600 hover:text-blue-700 transition-colors">공급사</Link>
          <Link href="/license-market" className="text-gray-600 hover:text-blue-700 transition-colors">허가마켓</Link>

          {user ? (
            <>
              {isAdmin ? (
                <Link href="/dashboard/admin" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                  관리자 요청사항
                </Link>
              ) : (
                <Link href="/dashboard/buyer" className="text-gray-600 hover:text-blue-700 transition-colors">
                  내정보
                </Link>
              )}
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
                className="bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
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
