import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../lib/auth'
import { prisma } from '../../../../lib/db'
import { renderVideo } from '../../../../lib/render'

interface RouteContext {
  params: {
    id: string
  }
}

interface ScriptScene {
  text: string
  duration: number
  visualHint?: string
}

export async function GET(_request: Request, { params }: RouteContext) {
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
        exportAssets: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!renderJob) {
      return NextResponse.json({ error: 'Render job not found' }, { status: 404 })
    }

    return NextResponse.json({
      render: {
        id: renderJob.id,
        status: renderJob.status,
        templateKey: renderJob.templateKey,
        progressPercent: renderJob.progressPercent,
        outputUrl: renderJob.outputUrl,
        outputDuration: renderJob.outputDuration,
        outputFileSize: renderJob.outputFileSize,
        errorMessage: renderJob.errorMessage,
        retryCount: renderJob.retryCount,
        startedAt: renderJob.startedAt,
        completedAt: renderJob.completedAt,
        createdAt: renderJob.createdAt,
        project: renderJob.project,
        exports: renderJob.exportAssets.map((asset) => ({
          id: asset.id,
          fileUrl: asset.fileUrl,
          fileSize: asset.fileSize,
          duration: asset.duration,
          format: asset.format,
          resolution: asset.resolution,
          createdAt: asset.createdAt,
        })),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Render GET error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
          include: {
            preset: {
              select: {
                primaryColor: true,
                secondaryColor: true,
                logoUrl: true,
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
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!renderJob) {
      return NextResponse.json({ error: 'Render job not found' }, { status: 404 })
    }

    if (renderJob.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed renders can be retried' },
        { status: 400 },
      )
    }

    if (renderJob.retryCount >= 2) {
      return NextResponse.json({ error: 'Max retries exceeded' }, { status: 400 })
    }

    const project = renderJob.project
    const activeScript = project.scriptVersions[0]
    const latestVoiceover = project.voiceovers[0] ?? null

    if (!activeScript) {
      return NextResponse.json({ error: 'Active script not found' }, { status: 400 })
    }

    if (!latestVoiceover) {
      return NextResponse.json({ error: 'Voiceover not found' }, { status: 400 })
    }

    const scenes = parseScenes(activeScript.scenes)
    const voiceoverAudio = decodeDataUrlToBuffer(latestVoiceover.audioUrl ?? null)

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: 'RENDERING',
      },
    })

    await prisma.renderJob.update({
      where: {
        id: renderJob.id,
      },
      data: {
        status: 'RENDERING',
        progressPercent: 10,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: null,
        retryCount: {
          increment: 1,
        },
      },
    })

    const renderResult = await renderVideo({
      templateKey: renderJob.templateKey,
      hook: activeScript.hook,
      scenes,
      cta: activeScript.cta,
      voiceoverAudio,
      projectId: project.id,
      renderId: renderJob.id,
      brandColors: {
        primary: project.preset?.primaryColor ?? undefined,
        secondary: project.preset?.secondaryColor ?? undefined,
      },
    })

    if (!renderResult.success || !renderResult.outputUrl) {
      const failedJob = await prisma.renderJob.update({
        where: {
          id: renderJob.id,
        },
        data: {
          status: 'FAILED',
          progressPercent: 100,
          errorMessage: renderResult.error ?? 'Render retry failed',
          completedAt: new Date(),
        },
        include: {
          exportAssets: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      await prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: 'FAILED',
        },
      })

      return NextResponse.json(
        {
          error: renderResult.error ?? 'Render retry failed',
          render: {
            id: failedJob.id,
            status: failedJob.status,
            templateKey: failedJob.templateKey,
            progressPercent: failedJob.progressPercent,
            outputUrl: failedJob.outputUrl,
            outputDuration: failedJob.outputDuration,
            outputFileSize: failedJob.outputFileSize,
            errorMessage: failedJob.errorMessage,
            retryCount: failedJob.retryCount,
            startedAt: failedJob.startedAt,
            completedAt: failedJob.completedAt,
            createdAt: failedJob.createdAt,
            exports: failedJob.exportAssets.map((asset) => ({
              id: asset.id,
              fileUrl: asset.fileUrl,
              fileSize: asset.fileSize,
              duration: asset.duration,
              format: asset.format,
              resolution: asset.resolution,
              createdAt: asset.createdAt,
            })),
          },
        },
        { status: 500 },
      )
    }

    await prisma.exportAsset.create({
      data: {
        projectId: project.id,
        renderJobId: renderJob.id,
        fileUrl: renderResult.outputUrl,
        fileSize: renderResult.fileSize ?? 0,
        duration: renderResult.duration ?? activeScript.totalDuration,
        format: 'mp4',
        resolution: '1080x1920',
      },
    })

    const completedJob = await prisma.renderJob.update({
      where: {
        id: renderJob.id,
      },
      data: {
        status: 'COMPLETED',
        progressPercent: 100,
        outputUrl: renderResult.outputUrl,
        outputDuration: renderResult.duration ?? activeScript.totalDuration,
        outputFileSize: renderResult.fileSize ?? 0,
        errorMessage: null,
        completedAt: new Date(),
      },
      include: {
        exportAssets: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({
      success: true,
      render: {
        id: completedJob.id,
        status: completedJob.status,
        templateKey: completedJob.templateKey,
        progressPercent: completedJob.progressPercent,
        outputUrl: completedJob.outputUrl,
        outputDuration: completedJob.outputDuration,
        outputFileSize: completedJob.outputFileSize,
        errorMessage: completedJob.errorMessage,
        retryCount: completedJob.retryCount,
        startedAt: completedJob.startedAt,
        completedAt: completedJob.completedAt,
        createdAt: completedJob.createdAt,
        exports: completedJob.exportAssets.map((asset) => ({
          id: asset.id,
          fileUrl: asset.fileUrl,
          fileSize: asset.fileSize,
          duration: asset.duration,
          format: asset.format,
          resolution: asset.resolution,
          createdAt: asset.createdAt,
        })),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Render retry POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Render retry failed',
      },
      { status: 500 },
    )
  }
}

function parseScenes(value: unknown): ScriptScene[] {
  if (!Array.isArray(value)) {
    return []
  }

  const scenes: ScriptScene[] = []

  for (const scene of value) {
    if (!scene || typeof scene !== 'object') {
      continue
    }

    const candidate = scene as Record<string, unknown>
    const text = typeof candidate.text === 'string' ? candidate.text.trim() : ''
    const duration =
      typeof candidate.duration === 'number' && Number.isFinite(candidate.duration)
        ? candidate.duration
        : 5
    const visualHint =
      typeof candidate.visualHint === 'string' ? candidate.visualHint.trim() : undefined

    if (!text) {
      continue
    }

    scenes.push({
      text,
      duration: Math.max(2, Math.min(12, duration)),
      visualHint,
    })
  }

  return scenes
}

function decodeDataUrlToBuffer(dataUrl: string | null): Buffer | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return null
  }

  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex === -1) {
    return null
  }

  const meta = dataUrl.slice(0, commaIndex)
  const data = dataUrl.slice(commaIndex + 1)

  if (!meta.includes(';base64')) {
    return null
  }

  try {
    return Buffer.from(data, 'base64')
  } catch {
    return null
  }
}
