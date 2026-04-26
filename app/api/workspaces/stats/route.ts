import { NextResponse } from 'next/server'
import { requireAuth, getUserWorkspace } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        plan: true,
      },
    })

    const presetsCount = await prisma.brandPreset.count({
      where: {
        workspaceId: workspace.id,
      },
    })

    const videosUsedThisMonth = workspace.videosUsedThisMonth ?? 0
    const generationsQuota = subscription?.generationsQuota ?? 0
    const generationsUsed = subscription?.generationsUsed ?? 0

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      plan: subscription?.plan
        ? {
            tier: subscription.plan.tier,
            name: subscription.plan.name,
            generationsPerMonth: subscription.plan.generationsPerMonth,
            maxVideoLength: subscription.plan.maxVideoLength,
          }
        : null,
      usage: {
        videosUsedThisMonth,
        generationsQuota,
        generationsUsed,
        generationsRemaining: Math.max(0, generationsQuota - generationsUsed),
        presetsCount,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            autoRenew: subscription.autoRenew,
            canceledAt: subscription.canceledAt?.toISOString() ?? null,
            currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            generationsQuota: subscription.generationsQuota,
            generationsUsed: subscription.generationsUsed,
          }
        : null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Workspaces Stats GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
