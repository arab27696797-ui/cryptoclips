import { NextResponse } from 'next/server'
import { requireAuth, getUserWorkspace } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getBillingProvider } from '@/lib/billing/provider'

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const { planId } = body

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: workspace.id,
        amount: plan.priceMonthly,
        currency: 'USD',
        status: 'PENDING',
        planId: plan.id,
        billingPeriodStart: now,
        billingPeriodEnd: periodEnd,
      },
    })

    const provider = getBillingProvider()

    const checkoutResult = await provider.createCheckout({
      planId: plan.id,
      workspaceId: workspace.id,
      billingEmail: session.email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    })

    if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
      return NextResponse.json(
        { error: checkoutResult.error ?? 'Checkout creation failed' },
        { status: 500 },
      )
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        tributePaymentId: checkoutResult.paymentId,
        tributeCheckoutUrl: checkoutResult.checkoutUrl,
      },
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      invoiceId: invoice.id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Checkout POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
