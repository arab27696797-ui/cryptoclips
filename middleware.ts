import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

// Routes that are always public — no auth needed
const PUBLIC_PATHS = ['/', '/pricing', '/login', '/register', '/sign-in', '/sign-up']

// API routes that never need auth
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/plans',
  '/api/billing/plans',
  '/api/webhooks',
]

// Routes that need a valid JWT but NOT an active subscription
// (e.g. the billing flow itself — user needs to be able to pay)
const AUTH_ONLY_PREFIXES = [
  '/api/billing/checkout',
  '/api/billing/confirm',
  '/api/billing/subscription',
  '/api/billing/cancel',
  '/api/billing/reactivate',
]

// Routes that need both a valid JWT AND an active subscription
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/api/workspaces',
  '/api/brand-presets',
  '/api/projects',
  '/api/voices',
  '/api/templates',
  '/api/renders',
  '/api/upload',
  '/api/scripts',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('cryptoclips_session')?.value

  // Always allow static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // Always allow public API routes
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verify JWT helper — returns payload or null
  async function verifyJWT() {
    if (!session) return null
    try {
      const { payload } = await jwtVerify(session, getSecret(), { clockTolerance: 60 })
      return payload
    } catch {
      return null
    }
  }

  // Public pages — if already logged in, redirect to dashboard
  if (PUBLIC_PATHS.includes(pathname)) {
    const payload = await verifyJWT()
    if (payload && pathname !== '/') {
      // Logged-in user hitting /login or /register → send to dashboard
      if (pathname === '/login' || pathname === '/register' || pathname === '/sign-in' || pathname === '/sign-up') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  // AUTH_ONLY routes — need valid JWT, no subscription check
  if (AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const payload = await verifyJWT()
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // PROTECTED routes — need JWT + ACTIVE subscription
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const payload = await verifyJWT()

    // No valid JWT at all
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Clear stale cookie
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('cryptoclips_session', '', { maxAge: 0, path: '/' })
      return response
    }

    // Has JWT but no workspaceId in token — force to pricing
    const workspaceId = payload.workspaceId as string | undefined
    if (!workspaceId) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No active subscription' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/pricing', request.url))
    }

    // Check subscription status via DB — attach header for downstream use
    // We use a lightweight inline fetch to /api/billing/subscription/status
    // to avoid importing Prisma in Edge runtime (not supported)
    try {
      const statusUrl = new URL('/api/billing/subscription/status', request.url)
      const statusRes = await fetch(statusUrl.toString(), {
        headers: {
          cookie: request.headers.get('cookie') || '',
          'x-middleware-check': '1',
        },
      })

      if (statusRes.ok) {
        const { status } = await statusRes.json()
        if (status !== 'ACTIVE') {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Subscription required', subscriptionStatus: status },
              { status: 403 }
            )
          }
          return NextResponse.redirect(new URL('/pricing?reason=subscription_required', request.url))
        }
      }
      // If status check fails for any reason — let through (fail open)
      // to avoid locking out users due to a DB hiccup
    } catch {
      // Fail open — do not block user if status check throws
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
