import { prisma } from '../db'

export async function activateSubscription(params: {
  workspaceId: string
  planId: string
  invoiceId: string
}) {
  const { workspaceId, planId, invoiceId } = params

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new Error('Plan not found')
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const existingSub = await prisma.subscription.findUnique({
    where: { workspaceId },
  })

  const baseData = {
    planId,
    status: 'ACTIVE' as const,
    generationsLimit: plan.generationsPerMonth,
    generationsUsed: 0,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    autoRenew: true,
    canceledAt: null,
  }

  const subscription = existingSub
    ? await prisma.subscription.update({
        where: { workspaceId },
        data: baseData,
      })
    : await prisma.subscription.create({
        data: {
          workspaceId,
          ...baseData,
        },
      })

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: now,
    },
  })

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      currentPlanId: planId,
      videosUsedThisMonth: 0,
    },
  })

  return subscription
}

export async function renewSubscription(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  })

  if (!subscription || subscription.status !== 'ACTIVE' || !subscription.autoRenew) {
    return null
  }

  const now = new Date()
  const newPeriodEnd = new Date(now)
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

  const renewed = await prisma.subscription.update({
    where: { workspaceId },
    data: {
      generationsLimit: subscription.plan.generationsPerMonth,
      generationsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: newPeriodEnd,
      status: 'ACTIVE',
      canceledAt: null,
    },
  })

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      videosUsedThisMonth: 0,
      currentPlanId: subscription.planId,
    },
  })

  const invoice = await prisma.invoice.create({
    data: {
      workspaceId,
      amount: subscription.plan.priceMonthly,
      currency: 'USD',
      status: 'PAID',
      paidAt: now,
      planId: subscription.planId,
      billingPeriodStart: now,
      billingPeriodEnd: newPeriodEnd,
    },
  })

  return { subscription: renewed, invoice }
}

export async function cancelAutoRenew(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  })

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      autoRenew: false,
      canceledAt: new Date(),
    },
  })
}

export async function incrementGenerationsUsed(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  })

  if (!subscription) {
    return null
  }

  const updated = await prisma.subscription.update({
    where: { workspaceId },
    data: {
      generationsUsed: {
        increment: 1,
      },
    },
  })

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      videosUsedThisMonth: {
        increment: 1,
      },
    },
  })

  return updated
}

export async function checkGenerationsQuota(workspaceId: string): Promise<{
  hasQuota: boolean
  used: number
  quota: number
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  })

  if (!subscription) {
    return { hasQuota: false, used: 0, quota: 0 }
  }

  if (subscription.status !== 'ACTIVE') {
    return {
      hasQuota: false,
      used: subscription.generationsUsed,
      quota: subscription.generationsLimit,
    }
  }

  const now = new Date()
  const periodEnd = subscription.currentPeriodEnd

  if (periodEnd && now > periodEnd) {
    if (subscription.autoRenew) {
      const renewed = await renewSubscription(workspaceId)

      if (renewed) {
        return {
          hasQuota: true,
          used: renewed.subscription.generationsUsed,
          quota: renewed.subscription.generationsLimit,
        }
      }
    }

    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        status: 'CANCELED',
      },
    })

    return {
      hasQuota: false,
      used: subscription.generationsUsed,
      quota: subscription.generationsLimit,
    }
  }

  return {
    hasQuota: subscription.generationsUsed < subscription.generationsLimit,
    used: subscription.generationsUsed,
    quota: subscription.generationsLimit,
  }
}
