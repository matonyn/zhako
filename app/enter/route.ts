import { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  mintSessionValue,
  verifyQrToken,
} from '@/lib/galleryAuth'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t')
  if (!token) {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  let verified
  try {
    verified = verifyQrToken(token)
  } catch {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  if (!verified.ok) {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  const res = NextResponse.redirect(new URL('/explore', request.url))
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: mintSessionValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
  return res
}
