import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Video,
  Zap,
  TrendingUp,
  Palette,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
} from 'lucide-react';

export const metadata = {
  title: 'CryptoClips - Turn Crypto News Into Branded Video Content',
  description:
    'Transform crypto news, tweets, and articles into professional short-form videos in minutes. AI-powered script generation and video creation for crypto creators.',
  keywords:
    'crypto videos, crypto content creation, AI video generator, crypto marketing, short-form content, crypto social media, bitcoin videos, crypto clips',
  openGraph: {
    title: 'CryptoClips - Turn Crypto News Into Branded Video Content',
    description:
      'Transform crypto news into professional videos in minutes with AI',
    type: 'website',
    url: 'https://cryptoclips.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoClips - Turn Crypto News Into Branded Video Content',
    description:
      'Transform crypto news into professional videos in minutes with AI',
  },
};

export default function HomePage() {
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

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/#features"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              How It Works
            </Link>
          </nav>

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
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-pink-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
              <Zap className="h-4 w-4" />
              AI-Powered Crypto Content Creation
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
              Turn Crypto News Into
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                {' '}
                Branded Videos
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-600 md:text-2xl">
              Transform crypto news, tweets, and articles into professional
              short-form videos in minutes. No editing skills required.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-orange-500 to-pink-600 px-8 text-lg hover:from-orange-600 hover:to-pink-700"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="px-8 text-lg">
                  View Pricing
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              7-day free trial • 15 generations included • No credit card required
            </p>
          </div>

          {/* Social Proof */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">10k+</div>
                <div className="mt-2 text-sm text-gray-600">Videos Created</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">500+</div>
                <div className="mt-2 text-sm text-gray-600">Crypto Creators</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 fill-orange-500 text-orange-500"
                    />
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">4.9/5 Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
              Everything You Need for Crypto Content
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Professional video production workflow built specifically for crypto
              creators
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                AI Script Generation
              </h3>
              <p className="mt-2 text-gray-600">
                Turn any crypto news, tweet, or article into punchy video scripts
                optimized for social media engagement
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                <Video className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Instant Video Creation
              </h3>
              <p className="mt-2 text-gray-600">
                Generate professional crypto videos with multiple templates,
                voices, and styles in minutes
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Brand Consistency
              </h3>
              <p className="mt-2 text-gray-600">
                Save brand presets with your colors, fonts, and style. Every
                video matches your brand identity
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                10x Faster Production
              </h3>
              <p className="mt-2 text-gray-600">
                What used to take hours now takes minutes. Ship crypto content
                while it's still relevant
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Multi-Angle Support
              </h3>
              <p className="mt-2 text-gray-600">
                Generate bullish, bearish, or neutral takes on the same crypto
                news for different audiences
              </p>
            </Card>

            <Card className="border-2 p-6 transition-shadow hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                Social-First Format
              </h3>
              <p className="mt-2 text-gray-600">
                Optimized for YouTube Shorts, TikTok, Instagram Reels, and
                Twitter. Maximum reach, minimum effort
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
              From Crypto News to Video in 3 Steps
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Simple workflow. Professional results. No video editing required.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl space-y-12">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-xl font-bold text-white">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Paste Your Source
                </h3>
                <p className="mt-2 text-lg text-gray-600">
                  Drop in a crypto tweet, article, news link, or raw text. We
                  handle the rest.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-6 md:flex-row">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-xl font-bold text-white">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  AI Generates Your Script
                </h3>
                <p className="mt-2 text-lg text-gray-600">
                  Choose your angle (bullish, bearish, neutral) and duration.
                  Our AI creates a punchy, social-ready script.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-6 md:flex-row">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-xl font-bold text-white">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Render & Publish
                </h3>
                <p className="mt-2 text-lg text-gray-600">
                  Pick your template, voice, and branding. Hit render. Download
                  and publish to all your channels.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-orange-500 to-pink-600 px-8 text-lg hover:from-orange-600 hover:to-pink-700"
              >
                Start Creating Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-orange-600 to-pink-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold md:text-5xl">
            Ready to 10x Your Crypto Content Output?
          </h2>
          <p className="mt-4 text-xl opacity-90">
            Join hundreds of crypto creators shipping more content, faster
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-white px-8 text-lg text-orange-600 hover:bg-gray-100"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white px-8 text-lg text-white hover:bg-white/10"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            No credit card required • 7-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-600">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">CryptoClips</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Turn crypto news into branded video content in minutes
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">Product</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/#features" className="hover:text-gray-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-gray-900">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-gray-900">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">Company</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} CryptoClips. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
