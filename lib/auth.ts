import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from './db'

interface JWTPayload {
  sub: string
  email: string
  iat?: number
  exp?: number
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function requireAuth(): Promise<JWTPayload> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    throw new Error('Unauthorized')
  }

  try {
    const verified = await jwtVerify(session, getSecret(), { clockTolerance: 60 })
    return verified.payload as JWTPayload
  } catch {
    throw new Error('Unauthorized')
  }
}

export async function getUserWorkspace(userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      ownerId: userId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      videosUsedThisMonth: true,
      currentPlanId: true,
    },
  })

  return workspace
}
