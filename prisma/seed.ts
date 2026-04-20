import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      tier: 'STARTER',
      name: 'Starter',
      priceMonthly: 2900,
      priceYearly: 29000,
      maxVideos: 30,
      maxVideoLength: 30,
      maxTeamMembers: 1,
      maxVoices: 3,
      storageGb: 5,
      features: JSON.stringify([
        '30 videos/month',
        'Up to 30s per video',
        '3 AI voices',
        '5GB storage',
        'Basic templates',
      ]),
    },
    {
      tier: 'PRO',
      name: 'Pro',
      priceMonthly: 5900,
      priceYearly: 59000,
      maxVideos: 100,
      maxVideoLength: 60,
      maxTeamMembers: 3,
      maxVoices: 10,
      storageGb: 25,
      features: JSON.stringify([
        '100 videos/month',
        'Up to 60s per video',
        '10 AI voices',
        '25GB storage',
        'All templates',
        'Priority rendering',
      ]),
    },
    {
      tier: 'CREATOR',
      name: 'Creator',
      priceMonthly: 9900,
      priceYearly: 99000,
      maxVideos: 300,
      maxVideoLength: 75,
      maxTeamMembers: 10,
      maxVoices: 25,
      storageGb: 100,
      features: JSON.stringify([
        '300 videos/month',
        'Up to 75s per video',
        '25 AI voices',
        '100GB storage',
        'All templates + custom',
        'Priority rendering',
        'API access',
      ]),
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: {},
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
