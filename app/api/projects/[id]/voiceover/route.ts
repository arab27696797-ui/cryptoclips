import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
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
        scriptVersions: {
          where: {
            isActive: true,
          },
          orderBy: {
            versionNumber: 'desc',
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
    const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : ''

    if (!voiceId) {
      return NextResponse.json({ error: 'Voice ID is required' }, { status: 400 })
    }

    const scenes = parseScenes(activeScript.scenes)
    const fullScript = [activeScript.hook, ...scenes.map((scene) => scene.text), activeScript.cta]
      .filter(Boolean)
      .join(' ')

    const result = await generateVoiceover({
      text: fullScript,
      voiceId,
      projectId: project.id,
    })

    const voiceover = await prisma.voiceoverAsset.create({
      data: {
        projectId: project.id,
        scriptVersionId: activeScript.id,
        voiceId,
        voiceName: result.voiceName,
        language: project.outputLanguage,
        audioUrl: result.audioUrl,
        duration: result.duration,
        status: result.status.toUpperCase() as 'GENERATED' | 'PLACEHOLDER' | 'ERROR',
        error: result.error ?? null,
      },
    })

    if (result.status === 'generated' || result.status === 'placeholder') {
      await prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: 'READY',
        },
      })
    }

    return NextResponse.json({ voiceover }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Voiceover POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Voiceover generation failed',
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
