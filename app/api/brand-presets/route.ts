import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

const ALLOWED_LANGUAGES = new Set(['en', 'es', 'pt', 'ru'])

export async function GET() {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const presets = await prisma.brandPreset.findMany({
      where: {
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
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ presets })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Brand Presets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await safeJson(request)

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const channelName =
      typeof body.channelName === 'string' && body.channelName.trim().length > 0
        ? body.channelName.trim()
        : null
    const primaryColor = normalizeHexColor(body.primaryColor, '#F7931A')
    const secondaryColor = normalizeHexColor(body.secondaryColor, '#FFFFFF')
    const defaultLanguage =
      typeof body.defaultLanguage === 'string' ? body.defaultLanguage.trim() : ''
    const defaultVoice =
      typeof body.defaultVoice === 'string' && body.defaultVoice.trim().length > 0
        ? body.defaultVoice.trim()
        : null
    const logoUrl =
      typeof body.logoUrl === 'string' && body.logoUrl.trim().length > 0
        ? body.logoUrl.trim()
        : null
    const requestedDefault = Boolean(body.isDefault)

    if (!name || name.length > 120) {
      return NextResponse.json(
        { error: 'Preset name is required and must be under 120 characters' },
        { status: 400 },
      )
    }

    if (!ALLOWED_LANGUAGES.has(defaultLanguage)) {
      return NextResponse.json({ error: 'Invalid default language' }, { status: 400 })
    }

    const presetsCount = await prisma.brandPreset.count({
      where: {
        workspaceId: workspace.id,
      },
    })

    const shouldBeDefault = requestedDefault || presetsCount === 0

    const preset = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.brandPreset.updateMany({
          where: {
            workspaceId: workspace.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        })
      }

      return tx.brandPreset.create({
        data: {
          workspaceId: workspace.id,
          name,
          channelName,
          primaryColor,
          secondaryColor,
          logoUrl,
          defaultLanguage,
          defaultVoice,
          isDefault: shouldBeDefault,
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
    })

    return NextResponse.json({ preset }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Brand Presets POST error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create preset',
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
