import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';
import { getUsageStats } from '@/lib/billing/quota';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();

    // Get counts
    const [projectCount, renderCount, brandPresetCount] = await Promise.all([
      prisma.project.count({
        where: { workspaceId: workspace.id },
      }),
      prisma.renderJob.count({
        where: {
          project: {
            workspaceId: workspace.id,
          },
        },
      }),
      prisma.brandPreset.count({
        where: { workspaceId: workspace.id },
      }),
    ]);

    // Get recent renders
    const recentRenders = await prisma.renderJob.findMany({
      where: {
        project: {
          workspaceId: workspace.id,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get usage stats
    const usageStats = await getUsageStats(workspace.id);

    return NextResponse.json({
      stats: {
        projects: projectCount,
        renders: renderCount,
        brandPresets: brandPresetCount,
      },
      usage: usageStats,
      recentRenders,
    });
  } catch (error) {
    console.error('Get workspace stats error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch workspace stats' },
      { status: 500 }
    );
  }
}
