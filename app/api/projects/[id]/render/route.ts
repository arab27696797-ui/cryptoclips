import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
import { renderVideo } from '../../../../../lib/render'
import { generateVoiceover } from '../../../../../lib/tts/generator'

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

export async function POST(request: Request, { params }: RouteContext) {
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
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const activeScript = project.scriptVersions[0]

    if (!activeScript) {
      return NextResponse.json({ error: 'Generate a script first' }, { status: 400 })
    }

    const body = await safeJson(request)
    const templateKey =
      typeof body.templateKey === 'string' && body.templateKey.length > 0
        ? body.templateKey
        : 'clean-news'

    const requestedVoiceId =
      typeof body.voiceId === 'string' && body.voiceId.length > 0 ? body.voiceId : null

    const scenes = parseScenes(activeScript.scenes)

    if (scenes.length === 0) {
      return NextResponse.json(
        { error: 'Active script has no valid scenes' },
        { status: 400 },
      )
    }

    const fullScriptText = [activeScript.hook, ...scenes.map((scene) => scene.text), activeScript.cta]
      .filter(Boolean)
      .join(' ')

    let latestVoiceover = project.voiceovers[0] ?? null
    let voiceoverAudioBuffer: Buffer | null = decodeDataUrlToBuffer(latestVoiceover?.audioUrl ?? null)

    if ((!latestVoiceover || !voiceoverAudioBuffer) && requestedVoiceId) {
      const voiceoverResult = await generateVoiceover({
        text: fullScriptText,
        voiceId: requestedVoiceId,
        projectId: project.id,
      })

      latestVoiceover = await prisma.voiceoverAsset.create({
        data: {
          projectId: project.id,
          scriptVersionId: activeScript.id,
          voiceId: requestedVoiceId,
          voiceName: voiceoverResult.voiceName,
          language: project.outputLanguage,
          audioUrl: voiceoverResult.audioUrl,
          duration: voiceoverResult.duration,
          status: voiceoverResult.status.toUpperCase() as 'GENERATED' | 'PLACEHOLDER' | 'ERROR',
          error: voiceoverResult.error ?? null,
        },
      })

      voiceoverAudioBuffer = voiceoverResult.audioBuffer
    }

    if (!latestVoiceover) {
      return NextResponse.json(
        { error: 'Generate a voiceover first or pass voiceId in request body' },
        { status: 400 },
      )
    }

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: 'RENDERING',
      },
    })

    const renderJob = await prisma.renderJob.create({
      data: {
        projectId: project.id,
        templateKey,
        status: 'RENDERING',
        progressPercent: 10,
        startedAt: new Date(),
      },
    })

    const renderResult = await renderVideo({
      templateKey,
      hook: activeScript.hook,
      scenes,
      cta: activeScript.cta,
      voiceoverAudio: voiceoverAudioBuffer,
      projectId: project.id,
      renderId: renderJob.id,
      brandColors: {
        primary: project.preset?.primaryColor ?? undefined,
        secondary: project.preset?.secondaryColor ?? undefined,
      },
    })

    if (!renderResult.success || !renderResult.outputUrl) {
      await prisma.renderJob.update({
        where: {
          id: renderJob.id,
        },
        data: {
          status: 'FAILED',
          progressPercent: 100,
          errorMessage: renderResult.error ?? 'Render failed',
          completedAt: new Date(),
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
          error: renderResult.error ?? 'Render failed',
          renderJobId: renderJob.id,
        },
        { status: 500 },
      )
    }

    const exportAsset = await prisma.exportAsset.create({
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

    const updatedRenderJob = await prisma.renderJob.update({
      where: {
        id: renderJob.id,
      },
      data: {
        status: 'COMPLETED',
        progressPercent: 100,
        outputUrl: renderResult.outputUrl,
        outputDuration: renderResult.duration ?? activeScript.totalDuration,
        outputFileSize: renderResult.fileSize ?? 0,
        completedAt: new Date(),
      },
      include: {
        exportAssets: true,
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
      renderJob: updatedRenderJob,
      exportAsset,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Render POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Render failed',
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

function parseScenes(value: unknown): ScriptScene[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((scene) => {
      if (!scene || typeof scene !== 'object') {
        return null
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
        return null
      }

      return {
        text,
        duration: Math.max(2, Math.min(12, duration)),
        visualHint,
      }
    })
    .filter((scene): scene is ScriptScene => scene !== null)
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
