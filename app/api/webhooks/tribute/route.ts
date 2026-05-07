import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { activateSubscription } from '@/lib/billing/subscription'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-tribute-signature')

    // Verify webhook signature (implement based on Tribute docs)
    const webhookSecret = process.env.TRIBUTE_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      // TODO: Implement HMAC verification per Tribute docs
    }

    const { event, data } = body

    if (event === 'payment.confirmed' || event === 'subscription.active') {
      const { paymentId, workspaceId, planId } = data

      // Find invoice
      const invoice = await prisma.invoice.findFirst({
        where: {
          tributePaymentId: paymentId,
          status: 'PENDING',
        },
      })

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Update invoice
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })

      // Activate subscription
      await activateSubscription({
        workspaceId: workspaceId || invoice.workspaceId,
        planId: planId || invoice.planId!,
        invoiceId: invoice.id,
      })

      return NextResponse.json({ success: true })
    }

    if (event === 'payment.failed') {
      const { paymentId } = data

      await prisma.invoice.updateMany({
        where: { tributePaymentId: paymentId },
        data: { status: 'FAILED' },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Tribute webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
