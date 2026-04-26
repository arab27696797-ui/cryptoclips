import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from ''@/lib/auth''
import { prisma } from '@/lib/db'
import { enqueueRenderJob } from '@/lib/render'

interface RouteContext {
  params: {
    id: string
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const renderJob = await prisma.renderJob.findFirst({
      where: {
        id: params.id,
        project: {
          workspaceId: workspace.id,
        },
      },
      include: {
        project: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!renderJob) {
      return NextResponse.json({ error: 'Render job not found' }, { status: 404 })
    }

    if (renderJob.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed render jobs can be retried' },
        { status: 409 },
      )
    }

    if (renderJob.retryCount >= 2) {
      return NextResponse.json(
        { error: 'Retry limit reached for this render job' },
        { status: 409 },
      )
    }

    const activeSibling = await prisma.renderJob.findFirst({
      where: {
        projectId: renderJob.projectId,
        id: {
          not: renderJob.id,
        },
        status: {
          in: ['PENDING', 'RENDERING'],
        },
      },
      select: {
        id: true,
      },
    })

    if (activeSibling) {
      return NextResponse.json(
        { error: 'Another render is already in progress for this project' },
        { status: 409 },
      )
    }

    const updated = await prisma.renderJob.update({
      where: {
        id: renderJob.id,
      },
      data: {
        status: 'PENDING',
        progressPercent: 0,
        errorMessage: null,
        retryCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        status: true,
        progressPercent: true,
        templateKey: true,
        outputUrl: true,
        outputDuration: true,
        outputFileSize: true,
        errorMessage: true,
        retryCount: true,
        createdAt: true,
      },
    })

    await prisma.project.update({
      where: {
        id: renderJob.projectId,
      },
      data: {
        status: 'RENDERING',
      },
    })

    try {
      await enqueueRenderJob(renderJob.id)
    } catch (queueError) {
      await prisma.renderJob.update({
        where: {
          id: renderJob.id,
        },
        data: {
          status: 'FAILED',
          errorMessage:
            queueError instanceof Error ? queueError.message : 'Failed to queue render',
        },
      })

      await prisma.project.update({
        where: {
          id: renderJob.projectId,
        },
        data: {
          status: 'READY',
        },
      })

      throw queueError
    }

    return NextResponse.json({ renderJob: updated })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Render Retry POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retry render',
      },
      { status: 500 },
    )
  }
}
