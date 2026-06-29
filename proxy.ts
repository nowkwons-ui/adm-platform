import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 대시보드는 로그인 필수
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const accountStatus = user.app_metadata?.account_status as string | undefined
    const role = user.app_metadata?.role as string | undefined

    // 반려 계정은 /account-rejected 로
    if (accountStatus === 'REJECTED' && pathname !== '/account-rejected') {
      return NextResponse.redirect(new URL('/account-rejected', request.url))
    }

    // 승인 대기 계정(일반 유저)은 대시보드 접근 차단 → /register/pending 으로
    if (accountStatus === 'PENDING' && role !== 'ADMIN' && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/register/pending', request.url))
    }

    // 로그인 상태에서 /login, /register 접근 시 홈으로
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/account-rejected'],
}
