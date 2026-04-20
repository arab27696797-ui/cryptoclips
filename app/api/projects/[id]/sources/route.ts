import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
import { extractUrlContent } from '../../../../../lib/extract-url'

interface RouteContext {
  params: {
    id: string
  }
}

type SourceType = 'TEXT' | 'URL' | 'POST'

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
          select: {
            id: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status === 'RENDERING') {
      return NextResponse.json(
        { error: 'Cannot change sources while rendering is in progress' },
        { status: 409 },
      )
    }

    const body = await safeJson(request)
    const type = normalizeSourceType(body.type)

    if (!type) {
      return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    const rawText =
      typeof body.rawText === 'string' && body.rawText.trim().length > 0
        ? body.rawText.trim()
        : null

    const sourceUrl =
      typeof body.sourceUrl === 'string' && body.sourceUrl.trim().length > 0
        ? body.sourceUrl.trim()
        : null

    if ((type === 'TEXT' || type === 'POST') && !rawText) {
      return NextResponse.json(
        { error: 'Text content is required for this source type' },
        { status: 400 },
      )
    }

    if (type === 'URL' && !sourceUrl) {
      return NextResponse.json({ error: 'Source URL is required' }, { status: 400 })
    }

    let extracted: string | null = null
    let title: string | null = null
    let error: string | null = null

    if (type === 'URL' && sourceUrl) {
      const result = await extractUrlContent(sourceUrl)

      if (result.success) {
        extracted = result.text ?? null
        title = result.title ?? null
      } else {
        error = result.error ?? 'Extraction failed'
      }
    }

    const source = await prisma.sourceInput.create({
      data: {
        type,
        rawText,
        sourceUrl,
        title,
        extracted,
        error,
        projectId: project.id,
      },
    })

    if (project.scriptVersions.length > 0) {
      await prisma.scriptVersion.updateMany({
        where: {
          projectId: project.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      })
    }

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ source }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Sources POST error:', err)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function safeJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

function normalizeSourceType(value: unknown): SourceType | null {
  if (value === 'TEXT' || value === 'URL' || value === 'POST') {
    return value
  }

  return null
}
