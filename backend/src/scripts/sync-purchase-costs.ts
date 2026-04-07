import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPurchaseCosts() {
  console.log('Starting purchase cost sync (no defaults)...');

  // Only sync purchaseCost from routes to bookings where booking has 0 but route has purchaseCost
  const bookingsWithoutCost = await prisma.booking.findMany({
    where: { purchasePrice: { equals: 0 } },
    include: { route: true },
  });

  console.log(`Found ${bookingsWithoutCost.length} bookings with zero purchasePrice`);

  let updated = 0;
  for (const booking of bookingsWithoutCost) {
    if (booking.route?.purchaseCost && booking.route.purchaseCost > 0) {
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
      updated++;
      console.log(`Updated booking ${booking.id}: purchasePrice = ${routePurchaseCost}, profit = ${profit}`);
    }
  }

  console.log(`Updated ${updated} bookings with purchase cost from routes!`);
}

syncPurchaseCosts()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
