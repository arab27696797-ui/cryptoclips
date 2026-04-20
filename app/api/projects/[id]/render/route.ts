import { NextResponse } from 'next/server'

import { requireAuth, getUserWorkspace } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
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
      select: {
        id: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const renders = await prisma.renderJob.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        exports: {
          select: {
            id: true,
            fileUrl: true,
            fileSize: true,
            duration: true,
            format: true,
            resolution: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      renders: renders.map((render) => ({
        id: render.id,
        status: render.status,
        progressPercent: render.progressPercent,
        templateKey: render.templateKey,
        outputUrl: render.outputUrl,
        outputDuration: render.outputDuration,
        outputFileSize: render.outputFileSize,
        errorMessage: render.errorMessage,
        retryCount: render.retryCount,
        createdAt: render.createdAt,
        exports: render.exports.map((asset) => ({
          id: asset.id,
          fileUrl: asset.fileUrl,
          fileSize: asset.fileSize,
          duration: asset.duration,
          format: asset.format,
          resolution: asset.resolution,
        })),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Project Renders GET error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
