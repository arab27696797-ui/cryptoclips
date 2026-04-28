import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, HelpCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | CryptoClips",
  description:
    "Choose the CryptoClips plan that fits your publishing workflow. Turn crypto news, links, and raw text into short branded clips with clear monthly pricing.",
};

const plans = [
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    generations: "15 generations",
    description: "For solo operators testing a repeatable crypto content workflow.",
    cta: "Start with Starter",
    href: "/sign-up?plan=starter",
    highlight: false,
    features: [
      "15 clip generations per month",
      "Turn crypto news, links, and raw text into short clips",
      "Fast branded output for TikTok, Shorts, Reels, Telegram, and X",
      "Simple workflow for solo creators",
      "Monthly recurring subscription",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    generations: "40 generations",
    description: "For active creators and lean teams publishing every week.",
    cta: "Choose Pro",
    href: "/sign-up?plan=pro",
    highlight: true,
    badge: "Most Popular",
    features: [
      "40 clip generations per month",
      "Built for higher publishing volume",
      "Better fit for active creator workflows",
      "Consistent branded output across recurring posts",
      "Monthly recurring subscription",
    ],
  },
  {
    name: "Creator",
    price: "$99",
    period: "/month",
    generations: "90 generations",
    description: "For high-output teams, agencies, and serious content operations.",
    cta: "Go with Creator",
    href: "/sign-up?plan=creator",
    highlight: false,
    features: [
      "90 clip generations per month",
      "Best for agencies and content teams",
      "Supports heavier publishing cadence",
      "Designed for repeatable, scalable output",
      "Monthly recurring subscription",
    ],
  },
];

const faqs = [
  {
    question: "What counts as a generation?",
    answer:
      "A generation is one completed clip creation flow inside CryptoClips. Your monthly plan defines how many generations you can use during the current billing period.",
  },
  {
    question: "Does my subscription renew automatically?",
    answer:
      "Yes. Subscriptions renew automatically every month by default unless you cancel auto-renew before the next billing date.",
  },
  {
    question: "What happens if I cancel auto-renew?",
    answer:
      "If you cancel, your access stays active until the end of the already paid billing period. The plan simply does not renew for the next month.",
  },
  {
    question: "Is this already connected to a live payment provider?",
    answer:
      "The billing flow is currently being finalized for production. The product logic is built around recurring subscriptions, and the live provider connection is prepared separately.",
  },
  {
    question: "Which plan should I choose?",
    answer:
      "Starter is best for solo testing, Pro is best for active creators, and Creator is best for agencies or teams with higher publishing volume.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white transition hover:text-white/80"
            >
              CryptoClips
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white/90"
              >
                Start now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_40%)]" />
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <Sparkles className="h-4 w-4" />
              Built for crypto creators, solo operators, and content teams
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pricing built for
              <span className="block text-white/70">
                fast crypto content output
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              Turn crypto news, links, and raw text into short branded clips.
              Pick the plan that matches your publishing pace and scale as your
              content operation grows.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white/90"
              >
                Start creating clips
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="#plans"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                See plans
              </Link>
            </div>

            <p className="mt-5 text-sm text-white/50">
              Clear monthly pricing. No vague enterprise gatekeeping. Choose a
              plan and start with a repeatable workflow.
            </p>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Choose the plan that fits your output
          </h2>
          <p className="mt-4 text-base leading-7 text-white/70">
            Starter is for testing your workflow. Pro is for steady publishing.
            Creator is for higher-volume teams and agencies.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex h-full flex-col rounded-3xl border p-8 ${
                plan.highlight
                  ? "border-white bg-white text-neutral-950 shadow-2xl shadow-white/10"
                  : "border-white/10 bg-white/5 text-white"
              }`}
            >
              {plan.highlight ? (
                <div className="absolute -top-3 left-8 inline-flex rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      plan.highlight ? "text-neutral-700" : "text-white/65"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span
                    className={`pb-1 text-sm ${
                      plan.highlight ? "text-neutral-600" : "text-white/60"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <p
                  className={`mt-3 text-sm font-medium ${
                    plan.highlight ? "text-neutral-800" : "text-white/80"
                  }`}
                >
                  {plan.generations}
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        plan.highlight ? "text-neutral-950" : "text-white"
                      }`}
                    />
                    <span
                      className={`text-sm leading-6 ${
                        plan.highlight ? "text-neutral-800" : "text-white/75"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex-1" />

              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-neutral-950 text-white hover:bg-neutral-800"
                    : "bg-white text-neutral-950 hover:bg-white/90"
                }`}
              >
                {plan.cta}
              </Link>

              <p
                className={`mt-4 text-xs leading-6 ${
                  plan.highlight ? "text-neutral-600" : "text-white/45"
                }`}
              >
                Subscriptions renew automatically each month unless canceled
                before the next billing date.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-medium text-white/50">Why teams pick CryptoClips</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Clear value, not vague AI promises
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              CryptoClips is built for turning information into output fast. The
              product is positioned around speed, consistency, and branded short-form
              publishing instead of generic “AI content” claims.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-medium text-white/50">Built for workflow</p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Match plan to publishing pace
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Starter works for validation, Pro fits regular weekly output, and
              Creator gives more room for agencies and high-output teams.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-medium text-white/50">Billing clarity</p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Recurring by default, transparent by design
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/70">
              The plan renews automatically every month unless auto-renew is
              canceled before the next billing date. If canceled, access stays
              active until the end of the paid period.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/50">Billing FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Questions users usually ask before choosing a plan
            </h2>
            <p className="mt-4 text-base leading-7 text-white/70">
              The pricing page should reduce friction, clarify recurring billing,
              and help users choose quickly.
            </p>
          </div>

          <div className="mt-10 divide-y divide-white/10">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-white/60" />
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-white/70">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-20">
        <div className="rounded-[2rem] border border-white/10 bg-white px-8 py-12 text-center text-neutral-950 sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Ready to start
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose a plan and start publishing faster
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            CryptoClips is built for people who want a repeatable crypto content
            workflow, not more manual content chaos.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Start now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
