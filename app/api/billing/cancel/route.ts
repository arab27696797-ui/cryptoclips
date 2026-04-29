import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();

    if (!workspace.subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel auto-renewal (subscription remains active until period end)
    const updatedSubscription = await prisma.subscription.update({
      where: { id: workspace.subscription.id },
      data: {
        autoRenew: false,
        canceledAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Auto-renewal canceled. Your subscription will remain active until the end of the current billing period.',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
