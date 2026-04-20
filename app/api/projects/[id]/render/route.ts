import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
import { enqueueRenderJob, listTemplates } from '../../../../../lib/render'

interface RouteContext {
  params: {
    id: string
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await safeJson(request)
    const templateKey =
      typeof body.templateKey === 'string' ? body.templateKey.trim() : ''

    if (!templateKey) {
      return NextResponse.json({ error: 'templateKey is required' }, { status: 400 })
    }

    const template = listTemplates().find((item) => item.key === templateKey)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
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
            id: true,
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
    if (!activeScript) {
      return NextResponse.json(
        { error: 'Generate a script before starting render' },
        { status: 400 },
      )
    }

    const latestVoiceover = project.voiceovers[0] ?? null
    if (!latestVoiceover) {
      return NextResponse.json(
        { error: 'Generate a voiceover before starting render' },
        { status: 400 },
      )
    }

    if (!latestVoiceover.audioUrl) {
      return NextResponse.json(
        { error: 'Latest voiceover has no audio file' },
        { status: 400 },
      )
    }

    const latestRender = project.renderJobs[0] ?? null
    if (latestRender?.status === 'PENDING' || latestRender?.status === 'RENDERING') {
      return NextResponse.json(
        { error: 'A render is already in progress' },
        { status: 409 },
      )
    }

    const renderJob = await prisma.renderJob.create({
      data: {
        projectId: project.id,
        scriptVersionId: activeScript.id,
        voiceoverId: latestVoiceover.id,
        templateKey,
        status: 'PENDING',
        progressPercent: 0,
        retryCount: 0,
        errorMessage: null,
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
        id: project.id,
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
          id: project.id,
        },
        data: {
          status: 'READY',
        },
      })

      throw queueError
    }

    return NextResponse.json({ renderJob }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Render POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start render',
      },
      { status: 500 },
    )
  }
}

async function safeJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}
