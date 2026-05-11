import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserWorkspace } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Lightweight endpoint used by middleware to check subscription status
// Returns { status } — one of: ACTIVE | INCOMPLETE | PAST_DUE | CANCELED | PAUSED | NONE
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ status: 'NONE' })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
      select: { status: true, currentPeriodEnd: true },
    })

    if (!subscription) {
      return NextResponse.json({ status: 'NONE' })
    }

    // Auto-expire check: if period ended and not renewed, treat as CANCELED
    if (
      subscription.status === 'ACTIVE' &&
      subscription.currentPeriodEnd &&
      new Date() > subscription.currentPeriodEnd
    ) {
      await prisma.subscription.update({
        where: { workspaceId: workspace.id },
        data: { status: 'CANCELED' },
      })
      return NextResponse.json({ status: 'CANCELED' })
    }

    return NextResponse.json({ status: subscription.status })
  } catch {
    // If auth fails, return NONE (middleware will handle redirect)
    return NextResponse.json({ status: 'NONE' }, { status: 200 })
  }
}
