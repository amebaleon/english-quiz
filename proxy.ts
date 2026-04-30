import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // ── 선생님 라우트 보호 ──────────────────────────────────
  if (pathname.startsWith('/teacher') && !pathname.startsWith('/teacher/login')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/teacher/login', request.url))
    }
  }

  // ── 학생 라우트 보호 ──────────────────────────────────
  if (
    (pathname.startsWith('/student/join') ||
      pathname.startsWith('/student/quiz') ||
      pathname.startsWith('/student/profile')) &&
    !pathname.startsWith('/student/login')
  ) {
    const studentId = request.cookies.get('student_id')?.value
    if (!studentId) {
      const loginUrl = new URL('/student/login', request.url)
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/teacher/:path*',
    '/student/join',
    '/student/quiz',
    '/student/profile',
  ],
}
