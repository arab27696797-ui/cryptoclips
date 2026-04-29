'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  generationsPerMonth: number;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  canceledAt: string | null;
  plan: Plan;
}

interface Usage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  planName: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/plans'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
        setUsage(subData.usage);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setAllPlans(plansData.plans);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!confirm('Are you sure you want to cancel auto-renewal? You will keep access until the end of your current billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        alert('Auto-renewal canceled successfully.');
      } else {
        alert('Failed to cancel auto-renewal.');
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateAutoRenew = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/billing/reactivate', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        alert('Auto-renewal reactivated successfully.');
      } else {
        alert('Failed to reactivate auto-renewal.');
      }
    } catch (error) {
      console.error('Failed to reactivate:', error);
      alert('An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-gray-600">
          Manage your plan, usage, and payment settings
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {subscription.plan.name}
                </h3>
                <p className="mt-1 text-gray-600">
                  ${subscription.plan.price}/month • {subscription.plan.generationsPerMonth} generations
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscription.status === 'trialing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {subscription.status === 'active' && 'Active'}
                {subscription.status === 'trialing' && 'Trial'}
                {subscription.status === 'canceled' && 'Canceled'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Current Period
                </div>
                <p className="mt-2 font-medium text-gray-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {subscription.autoRenew ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  Auto-Renewal
                </div>
                <p className="mt-2 font-medium text-gray-900">
                  {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                </p>
                {!subscription.autoRenew && subscription.canceledAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    Canceled on {new Date(subscription.canceledAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {subscription.autoRenew ? (
              <Button
                variant="outline"
                onClick={handleCancelAutoRenew}
                disabled={actionLoading}
              >
                Cancel Auto-Renewal
              </Button>
            ) : (
              <Button
                onClick={handleReactivateAutoRenew}
                disabled={actionLoading}
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
              >
                Reactivate Auto-Renewal
              </Button>
            )}

            {!subscription.autoRenew && (
              <div className="rounded-lg bg-orange-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
                  <div className="text-sm text-orange-900">
                    <p className="font-medium">Auto-renewal is disabled</p>
                    <p className="mt-1">
                      Your subscription will remain active until{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                      After that, you won't be charged and will lose access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Stats */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {usage.used} / {usage.limit}
                </p>
                <p className="text-sm text-gray-600">
                  {usage.remaining} generations remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">
                  {usage.percentage}%
                </p>
                <p className="text-sm text-gray-600">Used</p>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-600 transition-all"
                style={{ width: `${Math.min(usage.percentage, 100)}%` }}
              />
            </div>

            {usage.percentage >= 80 && (
              <div className="rounded-lg bg-orange-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
                  <div className="text-sm text-orange-900">
                    <p className="font-medium">Running low on generations</p>
                    <p className="mt-1">
                      You've used {usage.percentage}% of your monthly quota. Consider
                      upgrading to a higher plan for more generations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {allPlans.map((plan) => {
              const isCurrent = subscription?.plan.id === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border-2 p-6 ${
                    isCurrent ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {plan.generationsPerMonth} generations/month
                  </p>

                  {isCurrent ? (
                    <Button className="mt-4 w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="mt-4 w-full"
                      variant="outline"
                      onClick={() =>
                        alert(
                          'Plan upgrades/downgrades coming soon. Contact support for now.'
                        )
                      }
                    >
                      {subscription && plan.price > subscription.plan.price
                        ? 'Upgrade'
                        : 'Downgrade'}
                    </Button>
                  )}

                  <ul className="mt-4 space-y-2">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
