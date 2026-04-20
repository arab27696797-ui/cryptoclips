import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../lib/auth'
import { prisma } from '../../../../lib/db'

interface RouteContext {
  params: {
    id: string
  }
}

type SafeProjectStatus = 'DRAFT' | 'SCRIPTING' | 'READY' | 'RENDERING' | 'COMPLETED' | 'FAILED'

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        workspaceId: workspace.id,
      },
      include: {
        preset: {
          select: {
            name: true,
          },
        },
        sources: {
          orderBy: {
            createdAt: 'desc',
          },
        },
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
          where: {
            scriptVersion: {
              is: {
                isActive: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        renderJobs: {
          select: {
            status: true,
            createdAt: true,
          },
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

    const activeScript = project.scriptVersions[0] ?? null
    const activeVoiceover = project.voiceovers[0] ?? null
    const latestRender = project.renderJobs[0] ?? null

    const safeStatus = inferProjectStatus({
      persistedStatus: project.status,
      hasActiveScript: Boolean(activeScript),
      hasActiveVoiceover: Boolean(activeVoiceover),
      latestRenderStatus: latestRender?.status,
    })

    return NextResponse.json({
      project: {
        ...project,
        status: safeStatus,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Project GET error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        workspaceId: workspace.id,
      },
      include: {
        scriptVersions: {
          where: {
            isActive: true,
          },
          take: 1,
        },
        voiceovers: {
          where: {
            scriptVersion: {
              is: {
                isActive: true,
              },
            },
          },
          take: 1,
        },
        renderJobs: {
          select: {
            status: true,
            createdAt: true,
          },
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

    const safeStatus = inferProjectStatus({
      persistedStatus: project.status,
      hasActiveScript: project.scriptVersions.length > 0,
      hasActiveVoiceover: project.voiceovers.length > 0,
      latestRenderStatus: project.renderJobs[0]?.status,
    })

    if (safeStatus !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft projects can be deleted' },
        { status: 403 },
      )
    }

    await prisma.project.delete({
      where: {
        id: project.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Project DELETE error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function inferProjectStatus(params: {
  persistedStatus: SafeProjectStatus
  hasActiveScript: boolean
  hasActiveVoiceover: boolean
  latestRenderStatus?: 'PENDING' | 'RENDERING' | 'COMPLETED' | 'FAILED'
}): SafeProjectStatus {
  const {
    persistedStatus,
    hasActiveScript,
    hasActiveVoiceover,
    latestRenderStatus,
  } = params

  if (latestRenderStatus === 'PENDING' || latestRenderStatus === 'RENDERING') {
    return 'RENDERING'
  }

  if (!hasActiveScript) {
    return 'DRAFT'
  }

  if (hasActiveScript && !hasActiveVoiceover) {
    return 'SCRIPTING'
  }

  if (
    hasActiveScript &&
    hasActiveVoiceover &&
    (persistedStatus === 'COMPLETED' || latestRenderStatus === 'COMPLETED')
  ) {
    return 'COMPLETED'
  }

  if (hasActiveScript && hasActiveVoiceover) {
    return 'READY'
  }

  return persistedStatus
}
