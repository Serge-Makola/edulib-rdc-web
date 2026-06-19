import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard']
const ADMIN = ['/espace-direction']
const AUTH = ['/login', '/register']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get('__session')?.value
  const admin = req.cookies.get('el_admin')?.value
  const isAuth = !!session
  const isAdmin = admin === '1'

  if (PROTECTED.some(r => pathname.startsWith(r)) && !isAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  if (ADMIN.some(r => pathname.startsWith(r)) && (!isAuth || !isAdmin)) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (AUTH.some(r => pathname.startsWith(r)) && isAuth) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/espace-direction/:path*', '/login', '/register'],
}

export { proxy as middleware }
