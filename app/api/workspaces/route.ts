import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../lib/auth'
import { prisma } from '../../../lib/db'
import { workspaceUpdateSchema } from '../../../lib/validations'

export async function GET() {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        createdAt: workspace.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Workspaces GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    if (workspace.ownerId !== session.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await safeJson(request)
    const result = workspaceUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      )
    }

    const { name, slug } = result.data

    if (slug && slug !== workspace.slug) {
      const existing = await prisma.workspace.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      })

      if (existing) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
      }
    }

    const updated = await prisma.workspace.update({
      where: {
        id: workspace.id,
      },
      data: {
        ...(name ? { name } : {}),
        ...(slug ? { slug } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ workspace: updated })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Workspaces PATCH error:', error)
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
