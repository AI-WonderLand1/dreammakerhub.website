import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get('spatial_token')?.value

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const protectedRoutes = ['/worlds', '/editor', '/studio', '/marketplace', '/admin']

  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
