import { NextResponse } from 'next/server'
import { requireAuth, getUserWorkspace } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkGenerationsQuota, incrementGenerationsUsed } from '@/lib/billing/subscription'

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const quotaCheck = await checkGenerationsQuota(workspace.id)

    if (!quotaCheck.hasQuota) {
      return NextResponse.json(
        {
          error: 'Generation quota exceeded',
          details: {
            used: quotaCheck.used,
            quota: quotaCheck.quota,
            remaining: Math.max(0, quotaCheck.quota - quotaCheck.used),
          },
        },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { projectId, templateKey } = body

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: workspace.id,
      },
      include: {
        scriptVersions: {
          where: {
            isActive: true,
          },
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1,
        },
        voiceovers: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const activeScript = project.scriptVersions[0]
    const latestVoiceover = project.voiceovers[0] ?? null

    if (!activeScript) {
      return NextResponse.json({ error: 'Active script not found' }, { status: 400 })
    }

    if (!latestVoiceover || !latestVoiceover.audioUrl) {
      return NextResponse.json({ error: 'Voiceover not found' }, { status: 400 })
    }

    const renderJob = await prisma.renderJob.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
        templateKey: templateKey ?? 'clean-news',
        progressPercent: 0,
      },
    })

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: 'RENDERING',
      },
    })

    await incrementGenerationsUsed(workspace.id)

    return NextResponse.json({
      success: true,
      render: {
        id: renderJob.id,
        status: renderJob.status,
        templateKey: renderJob.templateKey,
        progressPercent: renderJob.progressPercent,
        createdAt: renderJob.createdAt,
      },
      quotaRemaining: quotaCheck.quota - quotaCheck.used - 1,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Renders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
