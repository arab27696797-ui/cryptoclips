import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TIER_ORDER: Record<string, number> = {
  STARTER: 1,
  PRO: 2,
  CREATOR: 3,
};

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        tier: true,
        name: true,
        priceMonthly: true,
        priceYearly: true,
        generationsPerMonth: true,
        maxVideoLength: true,
        maxTeamMembers: true,
        maxVoices: true,
        storageGb: true,
        features: true,
      },
    });

    const sortedPlans = [...plans].sort((a, b) => {
      const orderA = TIER_ORDER[a.tier] ?? 999;
      const orderB = TIER_ORDER[b.tier] ?? 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.priceMonthly - b.priceMonthly;
    });

    return NextResponse.json(
      { plans: sortedPlans },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Plans GET error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
