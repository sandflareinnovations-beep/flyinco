import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Starting Booking Reconciliation ---");

  // 1. Find orphaned bookings (userId is null AND agentDetails is missing or default)
  const orphans = await prisma.booking.findMany({
    where: {
      OR: [{ userId: null }, { agentDetails: "" }, { agentDetails: null }],
    },
  });

  console.log(`Found ${orphans.length} potentially orphaned bookings.`);

  let fixedCount = 0;

  for (const booking of orphans) {
    let matchedUser = null;

    // Strategy A: Match by agencyEmail if it exists
    if (booking.agencyEmail) {
      matchedUser = await prisma.user.findFirst({
        where: { email: { equals: booking.agencyEmail, mode: "insensitive" } },
      });
    }

    // Strategy B: Match by booking email if it matches an AGENT user
    if (!matchedUser && booking.email) {
      matchedUser = await prisma.user.findFirst({
        where: {
          email: { equals: booking.email, mode: "insensitive" },
          role: "AGENT",
        },
      });
    }

    // Strategy C: Match by phone if it matches an AGENT user
    if (!matchedUser && booking.phone) {
      matchedUser = await prisma.user.findFirst({
        where: {
          phone: { contains: booking.phone },
          role: "AGENT",
        },
      });
    }

    if (matchedUser) {
      console.log(
        `Matching booking ${booking.id} (${booking.passengerName}) to Agent ${matchedUser.name} (${matchedUser.agencyName || "No Agency"})`,
      );

      const agency = (
        matchedUser.agencyName ||
        matchedUser.name ||
        "Direct Agent"
      ).trim();
      const person = (matchedUser.name || "Unknown").trim();
      const structuredDetails = `${agency} (${person})`;

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          userId: matchedUser.id,
          agentDetails: structuredDetails,
          agencyEmail: matchedUser.email,
        },
      });

      // Update agent's financial totals if the booking is active
      if (["CONFIRMED", "PENDING", "HELD"].includes(booking.status)) {
        const amount = booking.sellingPrice || 0;
        if (amount > 0) {
          await prisma.user.update({
            where: { id: matchedUser.id },
            data: {
              pendingDues: { increment: amount },
              outstanding: { increment: amount },
              totalSales: { increment: amount },
            },
          });
          console.log(
            `Updated financials for ${matchedUser.name}: +SAR ${amount}`,
          );
        }
      }

      fixedCount++;
    }
  }

  console.log(`--- Reconciliation Finished: Fixed ${fixedCount} bookings ---`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
