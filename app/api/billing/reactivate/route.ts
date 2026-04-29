import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireWorkspace } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const workspace = await requireWorkspace();

    if (!workspace.subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Reactivate auto-renewal
    const updatedSubscription = await prisma.subscription.update({
      where: { id: workspace.subscription.id },
      data: {
        autoRenew: true,
        canceledAt: null,
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Auto-renewal reactivated successfully.',
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
