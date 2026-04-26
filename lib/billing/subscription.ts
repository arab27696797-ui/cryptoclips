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

  let subscription

  if (existingSub) {
    subscription = await prisma.subscription.update({
      where: { workspaceId },
      data: {
        planId,
        status: 'ACTIVE',
        generationsQuota: plan.generationsPerMonth,
        generationsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
        canceledAt: null,
      },
    })
  } else {
    subscription = await prisma.subscription.create({
      data: {
        workspaceId,
        planId,
        status: 'ACTIVE',
        generationsQuota: plan.generationsPerMonth,
        generationsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
      },
    })
  }

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
      generationsQuota: subscription.plan.generationsPerMonth,
      generationsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: newPeriodEnd,
    },
  })

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      videosUsedThisMonth: 0,
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

  const updated = await prisma.subscription.update({
    where: { workspaceId },
    data: {
      autoRenew: false,
      canceledAt: new Date(),
    },
  })

  return updated
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

  if (!subscription || subscription.status !== 'ACTIVE') {
    return { hasQuota: false, used: 0, quota: 0 }
  }

  const now = new Date()
  const periodEnd = subscription.currentPeriodEnd

  if (periodEnd && now > periodEnd) {
    return { hasQuota: false, used: subscription.generationsUsed, quota: subscription.generationsQuota }
  }

  const hasQuota = subscription.generationsUsed < subscription.generationsQuota

  return {
    hasQuota,
    used: subscription.generationsUsed,
    quota: subscription.generationsQuota,
  }
}
