import { NextResponse } from 'next/server'
import { requireAuth, getUserWorkspace } from '@/lib/auth'
import { cancelAutoRenew } from '@/lib/billing/subscription'

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const workspace = await getUserWorkspace(session.sub)

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const subscription = await cancelAutoRenew(workspace.id)

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        autoRenew: subscription.autoRenew,
        canceledAt: subscription.canceledAt?.toISOString() ?? null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      },
      message: 'Auto-renewal has been canceled. Your subscription will remain active until the end of the current billing period.',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Subscription not found') {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }
    }

    console.error('Cancel auto-renew POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
