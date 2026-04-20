import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../lib/auth'
import { prisma } from '../../../../lib/db'

interface RouteContext {
  params: {
    id: string
  }
}

const ALLOWED_LANGUAGES = new Set(['en', 'es', 'pt', 'ru'])

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const preset = await prisma.brandPreset.findFirst({
      where: {
        id: params.id,
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        name: true,
        channelName: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        defaultLanguage: true,
        defaultVoice: true,
        isDefault: true,
        createdAt: true,
      },
    })

    if (!preset) {
      return NextResponse.json({ error: 'Brand preset not found' }, { status: 404 })
    }

    return NextResponse.json({ preset })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Brand Preset GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const existing = await prisma.brandPreset.findFirst({
      where: {
        id: params.id,
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        workspaceId: true,
        isDefault: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Brand preset not found' }, { status: 404 })
    }

    const body = await safeJson(request)

    const updateData: {
      name?: string
      channelName?: string | null
      primaryColor?: string
      secondaryColor?: string
      logoUrl?: string | null
      defaultLanguage?: string
      defaultVoice?: string | null
      isDefault?: boolean
    } = {}

    if ('name' in body) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name || name.length > 120) {
        return NextResponse.json(
          { error: 'Preset name is required and must be under 120 characters' },
          { status: 400 },
        )
      }
      updateData.name = name
    }

    if ('channelName' in body) {
      updateData.channelName =
        typeof body.channelName === 'string' && body.channelName.trim().length > 0
          ? body.channelName.trim()
          : null
    }

    if ('primaryColor' in body) {
      updateData.primaryColor = normalizeHexColor(body.primaryColor, '#F7931A')
    }

    if ('secondaryColor' in body) {
      updateData.secondaryColor = normalizeHexColor(body.secondaryColor, '#FFFFFF')
    }

    if ('logoUrl' in body) {
      updateData.logoUrl =
        typeof body.logoUrl === 'string' && body.logoUrl.trim().length > 0
          ? body.logoUrl.trim()
          : null
    }

    if ('defaultLanguage' in body) {
      const defaultLanguage =
        typeof body.defaultLanguage === 'string' ? body.defaultLanguage.trim() : ''
      if (!ALLOWED_LANGUAGES.has(defaultLanguage)) {
        return NextResponse.json(
          { error: 'Invalid default language' },
          { status: 400 },
        )
      }
      updateData.defaultLanguage = defaultLanguage
    }

    if ('defaultVoice' in body) {
      updateData.defaultVoice =
        typeof body.defaultVoice === 'string' && body.defaultVoice.trim().length > 0
          ? body.defaultVoice.trim()
          : null
    }

    if ('isDefault' in body) {
      updateData.isDefault = Boolean(body.isDefault)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const preset = await prisma.$transaction(async (tx) => {
      if (updateData.isDefault === true) {
        await tx.brandPreset.updateMany({
          where: {
            workspaceId: workspace.id,
            isDefault: true,
            id: {
              not: existing.id,
            },
          },
          data: {
            isDefault: false,
          },
        })
      }

      const updated = await tx.brandPreset.update({
        where: {
          id: existing.id,
        },
        data: updateData,
        select: {
          id: true,
          name: true,
          channelName: true,
          primaryColor: true,
          secondaryColor: true,
          logoUrl: true,
          defaultLanguage: true,
          defaultVoice: true,
          isDefault: true,
          createdAt: true,
        },
      })

      const hasDefault =
        updateData.isDefault === false
          ? await tx.brandPreset.count({
              where: {
                workspaceId: workspace.id,
                isDefault: true,
              },
            })
          : 1

      if (updateData.isDefault === false && hasDefault === 0) {
        await tx.brandPreset.update({
          where: {
            id: existing.id,
          },
          data: {
            isDefault: true,
          },
        })

        return tx.brandPreset.findUniqueOrThrow({
          where: {
            id: existing.id,
          },
          select: {
            id: true,
            name: true,
            channelName: true,
            primaryColor: true,
            secondaryColor: true,
            logoUrl: true,
            defaultLanguage: true,
            defaultVoice: true,
            isDefault: true,
            createdAt: true,
          },
        })
      }

      return updated
    })

    return NextResponse.json({ preset })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Brand Preset PATCH error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update preset',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const preset = await prisma.brandPreset.findFirst({
      where: {
        id: params.id,
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        isDefault: true,
      },
    })

    if (!preset) {
      return NextResponse.json({ error: 'Brand preset not found' }, { status: 404 })
    }

    const linkedProjects = await prisma.project.count({
      where: {
        workspaceId: workspace.id,
        brandPresetId: preset.id,
      },
    })

    if (linkedProjects > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete a preset that is used by existing projects',
        },
        { status: 409 },
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.brandPreset.delete({
        where: {
          id: preset.id,
        },
      })

      if (preset.isDefault) {
        const replacement = await tx.brandPreset.findFirst({
          where: {
            workspaceId: workspace.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
          },
        })

        if (replacement) {
          await tx.brandPreset.update({
            where: {
              id: replacement.id,
            },
            data: {
              isDefault: true,
            },
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Brand Preset DELETE error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete preset',
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

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const raw = value.trim().toUpperCase()
  const withHash = raw.startsWith('#') ? raw : `#${raw}`

  return /^#[0-9A-F]{6}$/.test(withHash) ? withHash : fallback
}
