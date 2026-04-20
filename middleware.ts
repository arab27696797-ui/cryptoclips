import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  const isAuthPage =
    request.nextUrl.pathname === '/sign-in' ||
    request.nextUrl.pathname === '/sign-up'

  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')
  const isApiPublic = request.nextUrl.pathname === '/api/plans'

  if (isApiAuth || isApiPublic) {
    return NextResponse.next()
  }

  if (isAuthPage && session) {
    try {
      await jwtVerify(session, getSecret(), { clockTolerance: 60 })
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch {
      return NextResponse.next()
    }
  }

  const isProtected =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/api/workspaces') ||
    request.nextUrl.pathname.startsWith('/api/brand-presets') ||
    request.nextUrl.pathname.startsWith('/api/projects') ||
    request.nextUrl.pathname.startsWith('/api/voices') ||
    request.nextUrl.pathname.startsWith('/api/templates') ||
    request.nextUrl.pathname.startsWith('/api/renders') ||
    request.nextUrl.pathname.startsWith('/api/upload') ||
    request.nextUrl.pathname.startsWith('/api/webhooks')

  if (isProtected) {
    if (!session) {
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    try {
      await jwtVerify(session, getSecret(), { clockTolerance: 60 })
      return NextResponse.next()
    } catch {
      const response = isAuthPage
        ? NextResponse.next()
        : NextResponse.redirect(new URL('/sign-in', request.url))
      response.cookies.set('session', '', { maxAge: 0, path: '/' })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
