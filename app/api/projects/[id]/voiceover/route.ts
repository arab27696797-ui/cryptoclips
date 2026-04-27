import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
import { generateVoiceover } from '../../../../../lib/tts/generator'
import { listAllVoices } from '../../../../../lib/tts/voices'

interface RouteContext {
  params: {
    id: string
  }
}

type SceneLike = {
  text?: string
  duration?: number
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

    const latestRender = project.renderJobs[0] ?? null
    if (latestRender?.status === 'PENDING' || latestRender?.status === 'RENDERING') {
      return NextResponse.json(
        { error: 'Cannot generate voiceover while rendering is in progress' },
        { status: 409 },
      )
    }

    const activeScript = project.scriptVersions[0] ?? null
    if (!activeScript) {
      return NextResponse.json(
        { error: 'Generate a script before creating a voiceover' },
        { status: 400 },
      )
    }

    const body = await safeJson(request)
    const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : ''

    if (!voiceId) {
      return NextResponse.json({ error: 'voiceId is required' }, { status: 400 })
    }

    const voice = listAllVoices().find((item) => item.id === voiceId)

    if (!voice) {
      return NextResponse.json({ error: 'Voice not found' }, { status: 404 })
    }

    if (voice.language !== project.outputLanguage) {
      return NextResponse.json(
        { error: 'Selected voice does not match project language' },
        { status: 400 },
      )
    }

    const scriptText = buildVoiceoverText(activeScript)

    if (!scriptText) {
      return NextResponse.json(
        { error: 'Active script has no usable text for voiceover' },
        { status: 400 },
      )
    }

    const generated = await generateVoiceover({
      text: scriptText,
      voiceId: voice.id,
    })

    const voiceover = await prisma.voiceover.create({
      data: {
        projectId: project.id,
        scriptVersionId: activeScript.id,
        voiceId: voice.id,
        voiceName: voice.name,
        audioUrl: generated.audioUrl,
        duration: generated.duration ?? activeScript.totalDuration ?? 0,
        status: 'COMPLETED',
        error: null,
      },
      select: {
        id: true,
        voiceId: true,
        voiceName: true,
        audioUrl: true,
        duration: true,
        status: true,
        error: true,
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

    return NextResponse.json({ voiceover }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Voiceover POST error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Voiceover generation failed',
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

function buildVoiceoverText(script: {
  hook?: string | null
  cta?: string | null
  scenes?: unknown
}) {
  const parts: string[] = []

  if (script.hook?.trim()) {
    parts.push(script.hook.trim())
  }

  const scenes = Array.isArray(script.scenes) ? (script.scenes as SceneLike[]) : []
  for (const scene of scenes) {
    if (typeof scene?.text === 'string' && scene.text.trim()) {
      parts.push(scene.text.trim())
    }
  }

  if (script.cta?.trim()) {
    parts.push(script.cta.trim())
  }

  return parts.join('\n\n').trim()
}
