import { NextResponse } from 'next/server'
import { requireAuth, getUserWorkspace } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getBillingProvider } from '@/lib/billing/provider'
import { activateSubscription } from '@/lib/billing/subscription'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.redirect(new URL('/dashboard/billing?error=no_workspace', request.url))
    }

    const url = new URL(request.url)
    const paymentId = url.searchParams.get('paymentId')
    const planId = url.searchParams.get('planId')

    if (!paymentId || !planId) {
      return NextResponse.redirect(new URL('/dashboard/billing?error=invalid_params', request.url))
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        workspaceId: workspace.id,
        tributePaymentId: paymentId,
        status: 'PENDING',
      },
    })

    if (!invoice) {
      return NextResponse.redirect(new URL('/dashboard/billing?error=invoice_not_found', request.url))
    }

    const provider = getBillingProvider()
    const confirmResult = await provider.confirmPayment({
      paymentId,
      workspaceId: workspace.id,
    })

    if (!confirmResult.success) {
      return NextResponse.redirect(new URL('/dashboard/billing?error=payment_failed', request.url))
    }

    await activateSubscription({
      workspaceId: workspace.id,
      planId,
      invoiceId: invoice.id,
    })

    return NextResponse.redirect(new URL('/dashboard/billing?success=true', request.url))
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.redirect(new URL('/dashboard/billing?error=server_error', request.url))
  }
}
