import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Skip auth for login page, auth API routes, Next.js internals, and static files
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('admin_session')
  const sessionToken = process.env.ADMIN_SESSION_TOKEN

  if (!sessionCookie || sessionCookie.value !== sessionToken) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
