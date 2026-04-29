import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';
import { getUsageStats } from '@/lib/billing/quota';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();

    const usageStats = await getUsageStats(workspace.id);

    if (!usageStats) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscription: workspace.subscription,
      usage: usageStats,
    });
  } catch (error) {
    console.error('Get subscription error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
