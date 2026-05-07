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
  const session = request.cookies.get('cryptoclips_session')?.value

  const isAuthPage =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/sign-in' ||
    request.nextUrl.pathname === '/sign-up'

  const isPricingPage = request.nextUrl.pathname === '/pricing'
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')
  const isApiPublic = request.nextUrl.pathname === '/api/plans'
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks')

  if (isApiAuth || isApiPublic || isWebhook) {
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
    request.nextUrl.pathname.startsWith('/api/billing') ||
    request.nextUrl.pathname.startsWith('/api/scripts')

  if (isProtected || isPricingPage) {
    if (!session) {
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const verified = await jwtVerify(session, getSecret(), { clockTolerance: 60 })
      const payload = verified.payload

      if (isProtected && !isPricingPage) {
        const workspaceId = payload.workspaceId as string | undefined
        if (!workspaceId) {
          return NextResponse.redirect(new URL('/pricing', request.url))
        }
      }

      return NextResponse.next()
    } catch {
      const response = isAuthPage
        ? NextResponse.next()
        : request.nextUrl.pathname.startsWith('/api')
          ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          : NextResponse.redirect(new URL('/login', request.url))

      response.cookies.set('cryptoclips_session', '', { maxAge: 0, path: '/' })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
