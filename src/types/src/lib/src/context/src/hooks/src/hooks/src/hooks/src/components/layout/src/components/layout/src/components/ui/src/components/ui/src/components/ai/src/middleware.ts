import { NextRequest, NextResponse } from 'next/server'

// Routes qui nécessitent une connexion
const PROTECTED_ROUTES = ['/dashboard']

// Routes réservées à l'admin
const ADMIN_ROUTES = ['/admin']

// Routes accessibles uniquement aux non-connectés
const AUTH_ROUTES = ['/login', '/register']

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID!

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Lire le token Firebase depuis le cookie de session
  const sessionCookie = req.cookies.get('__session')?.value
  const adminCookie = req.cookies.get('el_admin')?.value

  const isAuthenticated = !!sessionCookie
  const isAdmin = adminCookie === '1'

  // Rediriger vers /login si route protégée sans session
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Rediriger vers / si route admin sans droits admin
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Rediriger vers / si déjà connecté et tente d'accéder à login/register
  if (AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/reset-password',
  ],
}
