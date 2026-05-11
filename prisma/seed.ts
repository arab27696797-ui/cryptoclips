import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await prisma.renderJob.deleteMany();
  await prisma.scriptVersion.deleteMany();
  await prisma.project.deleteMany();
  await prisma.brandPreset.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();

  console.log('Cleared existing data');

  // Create Plans
  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for getting started with crypto content creation',
      price: 19.00,
      currency: 'USD',
      interval: 'month',
      tier: 'starter',
      priceMonthly: 1900,
      priceYearly: 19000,
      generationsPerMonth: 15,
      maxVideoLength: 60,
      maxTeamMembers: 1,
      maxVoices: 3,
      storageGb: 5,
      features: [
        '15 video generations per month',
        'All video templates',
        'AI script generation',
        'Text-to-speech voices',
        'Brand presets',
        'Basic support',
      ],
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      slug: 'pro',
      description: 'For professional creators and teams',
      price: 49.00,
      currency: 'USD',
      interval: 'month',
      tier: 'pro',
      priceMonthly: 4900,
      priceYearly: 49000,
      generationsPerMonth: 40,
      maxVideoLength: 60,
      maxTeamMembers: 3,
      maxVoices: 10,
      storageGb: 20,
      features: [
        '40 video generations per month',
        'All video templates',
        'AI script generation',
        'Text-to-speech voices',
        'Unlimited brand presets',
        'Priority support',
        'Advanced customization',
      ],
      isActive: true,
    },
  });

  const creatorPlan = await prisma.plan.create({
    data: {
      name: 'Creator',
      slug: 'creator',
      description: 'For agencies and high-volume content production',
      price: 99.00,
      currency: 'USD',
      interval: 'month',
      tier: 'creator',
      priceMonthly: 9900,
      priceYearly: 99000,
      generationsPerMonth: 90,
      maxVideoLength: 60,
      maxTeamMembers: 10,
      maxVoices: 25,
      storageGb: 100,
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
      isActive: true,
    },
  });

  console.log('Created plans:', {
    starter: starterPlan.name,
    pro: proPlan.name,
    creator: creatorPlan.name,
  });

  console.log('Seed completed successfully!');
  console.log('\nPlans created:');
  console.log(`- ${starterPlan.name}: $${starterPlan.price}/month - ${starterPlan.generationsPerMonth} generations`);
  console.log(`- ${proPlan.name}: $${proPlan.price}/month - ${proPlan.generationsPerMonth} generations`);
  console.log(`- ${creatorPlan.name}: $${creatorPlan.price}/month - ${creatorPlan.generationsPerMonth} generations`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
