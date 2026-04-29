import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';
import { checkQuota, incrementUsage } from '@/lib/billing/quota';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();
    const body = await request.json();

    const { projectId, scriptVersionId, template, voice, brandPresetId } = body;

    // Validation
    if (!projectId || !scriptVersionId) {
      return NextResponse.json(
        { error: 'Project ID and script version ID are required' },
        { status: 400 }
      );
    }

    // Check if project exists and belongs to workspace
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: workspace.id,
      },
      include: {
        scriptVersions: {
          where: { id: scriptVersionId },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.scriptVersions.length === 0) {
      return NextResponse.json(
        { error: 'Script version not found' },
        { status: 404 }
      );
    }

    const scriptVersion = project.scriptVersions[0];

    // Check quota
    const hasQuota = await checkQuota(workspace.id);

    if (!hasQuota) {
      return NextResponse.json(
        { 
          error: 'Generation limit reached',
          details: 'You have reached your monthly generation limit. Please upgrade your plan or wait for the next billing cycle.',
        },
        { status: 403 }
      );
    }

    // Get brand preset if provided
    let brandPreset = null;
    if (brandPresetId) {
      brandPreset = await prisma.brandPreset.findFirst({
        where: {
          id: brandPresetId,
          workspaceId: workspace.id,
        },
      });

      if (!brandPreset) {
        return NextResponse.json(
          { error: 'Brand preset not found' },
          { status: 404 }
        );
      }
    }

    // Create render job
    const renderJob = await prisma.renderJob.create({
      data: {
        projectId,
        scriptVersionId,
        status: 'queued',
        template: template || 'clean-news',
        voice: voice || 'en-US-GuyNeural',
        brandPresetId: brandPresetId || null,
        config: {
          template: template || 'clean-news',
          voice: voice || 'en-US-GuyNeural',
          brandColors: brandPreset ? {
            primary: brandPreset.primaryColor,
            secondary: brandPreset.secondaryColor,
            background: brandPreset.backgroundColor,
          } : undefined,
        },
      },
    });

    // Increment usage counter
    await incrementUsage(workspace.id);

    // TODO: Queue the render job for processing
    // In production, this would go to a background job queue (BullMQ, etc.)
    // For now, we'll just mark it as queued

    return NextResponse.json({
      renderJob,
      message: 'Render started successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Start render error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to start render' },
      { status: 500 }
    );
  }
}
