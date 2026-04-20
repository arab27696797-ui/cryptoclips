import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../lib/auth'
import { prisma } from '../../../../lib/db'

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
    const maxVideos = subscription?.plan?.maxVideos ?? 0

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
            maxVideos: subscription.plan.maxVideos,
            maxVideoLength: subscription.plan.maxVideoLength,
          }
        : null,
      usage: {
        videosUsedThisMonth,
        videosRemaining: Math.max(0, maxVideos - videosUsedThisMonth),
        presetsCount,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            videosQuota: subscription.videosQuota,
            videosUsed: subscription.videosUsed,
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
