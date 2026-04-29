import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Video } from 'lucide-react';

export const metadata = {
  title: 'Pricing - CryptoClips',
  description:
    'Simple, transparent pricing for crypto content creators. Choose your plan and start creating.',
};

const plans = [
  {
    name: 'Starter',
    price: 19,
    generations: 15,
    description: 'Perfect for getting started with crypto content creation',
    features: [
      '15 video generations per month',
      'All video templates',
      'AI script generation',
      'Text-to-speech voices',
      'Brand presets',
      'Basic support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: 49,
    generations: 40,
    description: 'For professional creators and teams',
    features: [
      '40 video generations per month',
      'All video templates',
      'AI script generation',
      'Text-to-speech voices',
      'Unlimited brand presets',
      'Priority support',
      'Advanced customization',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Creator',
    price: 99,
    generations: 90,
    description: 'For agencies and high-volume content production',
    features: [
      '90 video generations per month',
      'All video templates',
      'AI script generation',
      'Text-to-speech voices',
      'Unlimited brand presets',
      'Dedicated support',
      'Advanced customization',
      'API access (coming soon)',
    ],
    cta: 'Get Started',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-600">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">CryptoClips</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="flex-1 bg-gradient-to-br from-orange-50 via-white to-pink-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold text-gray-900 md:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Choose your plan and start creating viral crypto content today.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden p-8 transition-shadow hover:shadow-xl ${
                  plan.popular ? 'border-2 border-orange-500 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0 bg-gradient-to-r from-orange-500 to-pink-600 px-3 py-1 text-xs font-medium text-white">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {plan.description}
                  </p>

                  <div className="mt-6">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-orange-600">
                    {plan.generations} generations/month
                  </p>
                </div>

                <Link href="/register" className="mt-8 block">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mx-auto mt-20 max-w-3xl">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>

            <div className="mt-12 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  How does billing work?
                </h3>
                <p className="mt-2 text-gray-600">
                  All plans are billed monthly and renew automatically. You can
                  cancel auto-renewal at any time from your billing settings.
                  When you cancel, you keep access until the end of your current
                  billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What happens if I run out of generations?
                </h3>
                <p className="mt-2 text-gray-600">
                  You can upgrade to a higher plan at any time to get more
                  generations. Your quota resets at the start of each billing
                  cycle.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Can I cancel anytime?
                </h3>
                <p className="mt-2 text-gray-600">
                  Yes! You can disable auto-renewal at any time. You'll continue
                  to have access until the end of your current billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  What payment methods do you accept?
                </h3>
                <p className="mt-2 text-gray-600">
                  We currently accept cryptocurrency payments. More payment
                  methods coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} CryptoClips. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
