import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'

export interface JWTPayload {
  sub: string
  email: string
  workspaceId?: string
}

const SESSION_COOKIE_NAME = 'cryptoclips_session'

function getSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  return new TextEncoder().encode(secret)
}

function isAppJWTPayload(payload: JoseJWTPayload): payload is JoseJWTPayload & JWTPayload {
  return (
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string' &&
    (payload.workspaceId === undefined || typeof payload.workspaceId === 'string')
  )
}

export async function verifySessionToken(session: string): Promise<JWTPayload> {
  try {
    const verified = await jwtVerify(session, getSecret(), { clockTolerance: 60 })

    if (!isAppJWTPayload(verified.payload)) {
      throw new Error('Unauthorized')
    }

    return {
      sub: verified.payload.sub,
      email: verified.payload.email,
      workspaceId: verified.payload.workspaceId,
    }
  } catch {
    throw new Error('Unauthorized')
  }
}

export async function getSession() {
  const cookieStore = cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return verifySessionToken(session)
}

export async function createSessionToken(payload: JWTPayload) {
  return new SignJWT({
    email: payload.email,
    workspaceId: payload.workspaceId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const cookieStore = cookies()

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function getUserWorkspace(userId: string) {
  const { prisma } = await import('./db')

  return prisma.workspace.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}
