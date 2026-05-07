import { prisma } from '@/lib/db';

/**
 * Check if workspace has available quota for generation
 */
export async function checkQuota(workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  if (!workspace || !workspace.subscription) {
    return false;
  }

  const { subscription } = workspace;

  // Check if subscription is active
  if (subscription.status !== 'ACTIVE') {
    return false;
  }

  // Check if within quota
  if (subscription.generationsUsed >= subscription.generationsLimit) {
    return false;
  }

  return true;
}

/**
 * Increment generation usage counter
 */
export async function incrementUsage(workspaceId: string): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      subscription: true,
    },
  });

  if (!workspace || !workspace.subscription) {
    throw new Error('Workspace or subscription not found');
  }

  await prisma.subscription.update({
    where: { id: workspace.subscription.id },
    data: {
      generationsUsed: {
        increment: 1,
      },
    },
  });
}

/**
 * Get current usage stats for workspace
 */
export async function getUsageStats(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  if (!workspace || !workspace.subscription) {
    return null;
  }

  const { subscription } = workspace;

  return {
    used: subscription.generationsUsed,
    limit: subscription.generationsLimit,
    remaining: Math.max(0, subscription.generationsLimit - subscription.generationsUsed),
    percentage: Math.round((subscription.generationsUsed / subscription.generationsLimit) * 100),
    planName: subscription.plan.name,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

/**
 * Reset quota for new billing period
 */
export async function resetQuota(subscriptionId: string): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      generationsUsed: 0,
    },
  });
}
