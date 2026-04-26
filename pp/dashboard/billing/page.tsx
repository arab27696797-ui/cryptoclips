'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Sparkles } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatPrice } from '@/lib/utils'

type Plan = {
  id: string
  tier: string
  name: string
  priceMonthly: number
  priceYearly: number
  generationsPerMonth: number
  maxVideoLength: number
  maxTeamMembers: number
  maxVoices: number
  storageGb: number
  features: string[] | string
}

type WorkspaceStats = {
  workspace: {
    id: string
    name: string
    slug: string
  }
  plan: {
    tier: string
    name: string
    generationsPerMonth: number
    maxVideoLength: number
  } | null
  usage: {
    videosUsedThisMonth: number
    generationsQuota: number
    generationsUsed: number
    generationsRemaining: number
    presetsCount: number
  }
  subscription: {
    status: string
    autoRenew: boolean
    canceledAt: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    generationsQuota: number
    generationsUsed: number
  } | null
}

function normalizeFeatures(value: Plan['features']) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<WorkspaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    title: string
    description: string
  } | null>(null)

  const activePlanTier = stats?.plan?.tier ?? null
  const usagePercent = useMemo(() => {
    if (!stats?.usage.generationsQuota) {
      return 0
    }

    return Math.min(
      100,
      Math.round((stats.usage.generationsUsed / stats.usage.generationsQuota) * 100),
    )
  }, [stats])

  async function loadData() {
    setLoading(true)

    try {
      const [plansRes, statsRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch('/api/workspaces/stats', { cache: 'no-store' }),
      ])

      if (!plansRes.ok) {
        throw new Error('Failed to load plans')
      }

      if (!statsRes.ok) {
        throw new Error('Failed to load workspace stats')
      }

      const plansJson = await plansRes.json()
      const statsJson = await statsRes.json()

      setPlans(plansJson.plans ?? [])
      setStats(statsJson)
    } catch (error) {
      setMessage({
        type: 'error',
        title: 'Unable to load billing data',
        description:
          error instanceof Error ? error.message : 'Please refresh the page and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const canceled = params.get('canceled')
    const error = params.get('error')

    if (success === 'true') {
      setMessage({
        type: 'success',
        title: 'Subscription activated',
        description: 'Your subscription is now active and your monthly generation quota has been assigned.',
      })
    } else if (canceled === 'true') {
      setMessage({
        type: 'error',
        title: 'Checkout canceled',
        description: 'The mock checkout flow was canceled before payment confirmation.',
      })
    } else if (error) {
      setMessage({
        type: 'error',
        title: 'Billing action failed',
        description: 'The billing flow could not be completed. Please try again.',
      })
    }

    void loadData()
  }, [])

  async function handleCheckout(planId: string) {
    setCheckoutLoadingPlanId(planId)
    setMessage(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Checkout failed')
      }

      if (!data.checkoutUrl) {
        throw new Error('Checkout URL was not returned')
      }

      window.location.href = data.checkoutUrl
    } catch (error) {
      setMessage({
        type: 'error',
        title: 'Checkout failed',
        description:
          error instanceof Error ? error.message : 'Failed to create checkout session.',
      })
      setCheckoutLoadingPlanId(null)
    }
  }

  async function handleCancelAutoRenew() {
    setCancelLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to cancel auto-renew')
      }

      setMessage({
        type: 'success',
        title: 'Auto-renew canceled',
        description:
          data.message ??
          'Auto-renew has been canceled. Your subscription stays active until the paid period ends.',
      })

      await loadData()
    } catch (error) {
      setMessage({
        type: 'error',
        title: 'Cancellation failed',
        description:
          error instanceof Error ? error.message : 'Could not cancel auto-renew.',
      })
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription, usage, and recurring billing settings.
        </p>
      </div>

      {message ? (
        <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="mb-2 h-4 w-4" />
          ) : (
            <AlertCircle className="mb-2 h-4 w-4" />
          )}
          <AlertTitle>{message.title}</AlertTitle>
          <AlertDescription>{message.description}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current subscription</CardTitle>
            <CardDescription>
              Your plan renews automatically every month by default. You must cancel auto-renew before the next billing date if you do not want the same plan to renew.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {stats?.subscription && stats?.plan ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="success">{stats.plan.name}</Badge>
                  <Badge variant={stats.subscription.autoRenew ? 'default' : 'warning'}>
                    {stats.subscription.autoRenew ? 'Auto-renew ON' : 'Auto-renew OFF'}
                  </Badge>
                  <Badge variant="outline">{stats.subscription.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Monthly usage</span>
                    <span>
                      {stats.usage.generationsUsed} / {stats.usage.generationsQuota} generations
                    </span>
                  </div>
                  <Progress value={usagePercent} />
                  <p className="text-sm text-muted-foreground">
                    {stats.usage.generationsRemaining} generations remaining in the current billing period.
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Current period ends</p>
                    <p className="mt-1 font-medium">
                      {formatDate(stats.subscription.currentPeriodEnd) ?? '—'}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Workspace</p>
                    <p className="mt-1 font-medium">{stats.workspace.name}</p>
                  </div>
                </div>

                {!stats.subscription.autoRenew && (
                  <Alert variant="default">
                    <AlertTitle>Access remains active</AlertTitle>
                    <AlertDescription>
                      Your subscription will stay active until{' '}
                      {formatDate(stats.subscription.currentPeriodEnd) ?? 'the end of the current period'}.
                      It will not renew automatically after that date.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert>
                <CreditCard className="mb-2 h-4 w-4" />
                <AlertTitle>No active subscription</AlertTitle>
                <AlertDescription>
                  Choose a plan below to start a mock recurring subscription and unlock monthly generation quota.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          {stats?.subscription?.autoRenew ? (
            <CardFooter>
              <Button
                variant="outline"
                onClick={handleCancelAutoRenew}
                disabled={cancelLoading}
              >
                {cancelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel auto-renew
              </Button>
            </CardFooter>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage snapshot</CardTitle>
            <CardDescription>
              Live workspace quota and monthly generation usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Generations used</p>
              <p className="mt-1 text-2xl font-semibold">{stats?.usage.generationsUsed ?? 0}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Generations remaining</p>
              <p className="mt-1 text-2xl font-semibold">{stats?.usage.generationsRemaining ?? 0}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Brand presets</p>
              <p className="mt-1 text-2xl font-semibold">{stats?.usage.presetsCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Choose your plan</h2>
          <p className="text-muted-foreground">
            Mock billing is active now. Tribute can be plugged in later without changing the product flow.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isActive = activePlanTier === plan.tier
            const features = normalizeFeatures(plan.features)

            return (
              <Card
                key={plan.id}
                className={isActive ? 'border-primary shadow-md' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.tier}</CardDescription>
                    </div>

                    {plan.tier === 'PRO' ? (
                      <Badge>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Popular
                      </Badge>
                    ) : null}
                  </div>

                  <div className="pt-3">
                    <div className="text-4xl font-bold">{formatPrice(plan.priceMonthly)}</div>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">Monthly quota</p>
                    <p className="mt-1 text-xl font-semibold">
                      {plan.generationsPerMonth} generations
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="flex-col items-stretch gap-3">
                  <Button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={checkoutLoadingPlanId === plan.id || isActive}
                    className="w-full"
                  >
                    {checkoutLoadingPlanId === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to mock checkout...
                      </>
                    ) : isActive ? (
                      'Current plan'
                    ) : (
                      'Start mock checkout'
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Auto-renew is enabled by default. If you cancel, access stays active until the end of the already paid billing period.
                  </p>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
