import { cookies } from 'next/headers'
import { jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'
import { prisma } from '@/lib/db'

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

export async function requireWorkspace() {
  const session = await requireAuth()

  if (!session.workspaceId) {
    throw new Error('No workspace found')
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  if (!workspace.subscription || workspace.subscription.status !== 'ACTIVE') {
    throw new Error('Subscription required')
  }

  return workspace
}

export async function getUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
  if (!match) return null

  try {
    return await verifySessionToken(match[1])
  } catch {
    return null
  }
}
