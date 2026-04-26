import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      tier: 'STARTER',
      name: 'Starter',
      priceMonthly: 1900,
      priceYearly: 19000,
      generationsPerMonth: 100,
      maxVideoLength: 60,
      maxTeamMembers: 1,
      maxVoices: 5,
      storageGb: 10,
      features: JSON.stringify([
        '100 video generations/month',
        'Up to 60s per video',
        '5 AI voices',
        '10GB storage',
        'All templates',
        'Email support',
      ]),
    },
    {
      tier: 'PRO',
      name: 'Pro',
      priceMonthly: 4900,
      priceYearly: 49000,
      generationsPerMonth: 300,
      maxVideoLength: 90,
      maxTeamMembers: 5,
      maxVoices: 15,
      storageGb: 50,
      features: JSON.stringify([
        '300 video generations/month',
        'Up to 90s per video',
        '15 AI voices',
        '50GB storage',
        'All templates',
        'Priority rendering',
        'Priority support',
      ]),
    },
    {
      tier: 'CREATOR',
      name: 'Creator',
      priceMonthly: 9900,
      priceYearly: 99000,
      generationsPerMonth: 1000,
      maxVideoLength: 120,
      maxTeamMembers: 15,
      maxVoices: 50,
      storageGb: 200,
      features: JSON.stringify([
        '1000 video generations/month',
        'Up to 120s per video',
        '50 AI voices',
        '200GB storage',
        'All templates + custom branding',
        'Priority rendering',
        'API access',
        'Dedicated support',
      ]),
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    })
  }

  console.log(`Seeded ${plans.length} plans.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
