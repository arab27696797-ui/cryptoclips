import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
import { generateScript } from '../../../../../lib/ai/script-generator'

interface RouteContext {
  params: {
    id: string
  }
}

type ScriptAngle = 'neutral' | 'bullish' | 'bearish'

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
        sources: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        scriptVersions: {
          select: {
            id: true,
            versionNumber: true,
          },
          orderBy: {
            versionNumber: 'desc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status === 'RENDERING') {
      return NextResponse.json(
        { error: 'Cannot generate script while rendering is in progress' },
        { status: 409 },
      )
    }

    if (project.sources.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one source before generating a script' },
        { status: 400 },
      )
    }

    const body = await safeJson(request)
    const angle = normalizeAngle(body.angle)

    if (!angle) {
      return NextResponse.json({ error: 'Invalid angle' }, { status: 400 })
    }

    const sourceText = project.sources
      .map((source) => source.extracted ?? source.rawText ?? '')
      .map((text) => text.trim())
      .filter(Boolean)
      .join('\n\n')

    if (!sourceText) {
      return NextResponse.json(
        { error: 'No usable source content found' },
        { status: 400 },
      )
    }

    const script = await generateScript({
      sourceText,
      outputLanguage: project.outputLanguage,
      targetLengthSeconds: project.targetLength,
      angle,
    })

    await prisma.scriptVersion.updateMany({
      where: {
        projectId: project.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    const nextVersionNumber = (project.scriptVersions[0]?.versionNumber ?? 0) + 1

    const scriptVersion = await prisma.scriptVersion.create({
      data: {
        projectId: project.id,
        versionNumber: nextVersionNumber,
        hook: script.hook,
        cta: script.cta,
        scenes: script.scenes as unknown as object,
        totalDuration: script.totalDuration,
        angle,
        isActive: true,
      },
    })

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: 'SCRIPTING',
        scriptAngle: angle,
      },
    })

    return NextResponse.json({ scriptVersion }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Script POST error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Script generation failed',
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

function normalizeAngle(value: unknown): ScriptAngle | null {
  if (value === 'neutral' || value === 'bullish' || value === 'bearish') {
    return value
  }

  if (value == null) {
    return 'neutral'
  }

  return null
}
