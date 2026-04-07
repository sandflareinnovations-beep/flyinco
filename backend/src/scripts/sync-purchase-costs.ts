import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPurchaseCosts() {
  console.log('Starting purchase cost sync...');

  // 1. Find routes without purchaseCost and set a default (e.g., 70% of price)
  const routesWithoutCost = await prisma.route.findMany({
    where: { purchaseCost: null },
  });

  console.log(`Found ${routesWithoutCost.length} routes without purchaseCost`);

  for (const route of routesWithoutCost) {
    // Default to 70% of price as purchase cost (30% margin assumption)
    const defaultCost = route.price * 0.7;
    await prisma.route.update({
      where: { id: route.id },
      data: { purchaseCost: defaultCost },
    });
    console.log(`Updated route ${route.id}: ${route.origin} → ${route.destination}, purchaseCost = ${defaultCost}`);
  }

  // 2. Sync purchaseCost from routes to bookings where it's null
  const bookingsWithoutCost = await prisma.booking.findMany({
    where: { purchasePrice: { equals: 0 } },
    include: { route: true },
  });

  console.log(`Found ${bookingsWithoutCost.length} bookings without purchasePrice`);

  for (const booking of bookingsWithoutCost) {
    if (booking.route?.purchaseCost) {
      const routePurchaseCost = booking.route.purchaseCost;
      const sellingPrice = booking.sellingPrice || 0;
      const profit = sellingPrice - routePurchaseCost;

      await prisma.booking.update({
        where: { id: booking.id },
        data: { 
          purchasePrice: routePurchaseCost,
          profit: profit,
        },
      });
      console.log(`Updated booking ${booking.id}: purchasePrice = ${routePurchaseCost}, profit = ${profit}`);
    }
  }

  console.log('Purchase cost sync complete!');
}

syncPurchaseCosts()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
