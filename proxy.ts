import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionValue } from '@/lib/galleryAuth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/enter' || pathname === '/locked') {
    return NextResponse.next()
  }

  if (pathname === '/' || pathname.startsWith('/explore')) {
    const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value
    let ok = false
    try {
      ok = Boolean(raw && verifySessionValue(raw))
    } catch {
      ok = false
    }

    if (!ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/locked'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/explore'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/explore/:path*', '/enter', '/locked'],
}
