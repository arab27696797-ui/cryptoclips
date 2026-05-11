import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'
import { activateSubscription } from '@/lib/billing/subscription'

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const hmac = createHmac('sha256', secret)
    hmac.update(rawBody, 'utf8')
    const expected = 'sha256=' + hmac.digest('hex')
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (sigBuffer.length !== expectedBuffer.length) return false
    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-tribute-signature') ?? ''
    const webhookSecret = process.env.TRIBUTE_WEBHOOK_SECRET

    // Verify HMAC signature when secret is configured
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      const valid = verifySignature(rawBody, signature, webhookSecret)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    let body: { event?: string; data?: Record<string, string> }
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { event, data } = body

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data' }, { status: 400 })
    }

    // -----------------------------------------------------------------------
    // payment.confirmed | subscription.active → activate subscription
    // -----------------------------------------------------------------------
    if (event === 'payment.confirmed' || event === 'subscription.active') {
      const { paymentId, workspaceId, planId } = data

      if (!paymentId) {
        return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 })
      }

      const invoice = await prisma.invoice.findFirst({
        where: {
          tributePaymentId: paymentId,
          status: 'PENDING',
        },
      })

      if (!invoice) {
        // Idempotency: already processed
        const paid = await prisma.invoice.findFirst({
          where: { tributePaymentId: paymentId, status: 'PAID' },
        })
        if (paid) return NextResponse.json({ success: true, idempotent: true })
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      const resolvedWorkspaceId = workspaceId || invoice.workspaceId
      const resolvedPlanId = planId || invoice.planId

      if (!resolvedPlanId) {
        return NextResponse.json({ error: 'Cannot resolve planId' }, { status: 400 })
      }

      await activateSubscription({
        workspaceId: resolvedWorkspaceId,
        planId: resolvedPlanId,
        invoiceId: invoice.id,
      })

      return NextResponse.json({ success: true })
    }

    // -----------------------------------------------------------------------
    // payment.failed → mark invoice failed
    // -----------------------------------------------------------------------
    if (event === 'payment.failed') {
      const { paymentId } = data
      if (!paymentId) {
        return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 })
      }
      await prisma.invoice.updateMany({
        where: { tributePaymentId: paymentId, status: 'PENDING' },
        data: { status: 'FAILED' },
      })
      return NextResponse.json({ success: true })
    }

    // -----------------------------------------------------------------------
    // subscription.canceled → cancel subscription
    // -----------------------------------------------------------------------
    if (event === 'subscription.canceled') {
      const { workspaceId } = data
      if (workspaceId) {
        await prisma.subscription.updateMany({
          where: { workspaceId, status: 'ACTIVE' },
          data: { status: 'CANCELED', canceledAt: new Date() },
        })
      }
      return NextResponse.json({ success: true })
    }

    // Unknown event — acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Tribute webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
