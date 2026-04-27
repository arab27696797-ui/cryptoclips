import { NextResponse } from 'next/server'

import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export async function GET() {
  try {
    const session = await requireAuth()

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: session.sub },
          {
            members: {
              some: {
                userId: session.sub,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        videosUsedThisMonth: true,
        currentPlanId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        videosUsedThisMonth: workspace.videosUsedThisMonth,
        currentPlanId: workspace.currentPlanId,
        createdAt: workspace.createdAt,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Workspaces GET error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
