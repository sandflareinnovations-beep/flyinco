/**
 * Repairs bookings whose `travelDate` does not match the `departureDate`
 * of the route they're attached to.
 *
 * Background: an old version of `bulkImport` had a fallback that, when the
 * primary date-based route match failed, picked the latest route in the
 * sector regardless of date. That silently attached bookings (e.g. for
 * April 8) to a future flight (e.g. April 14), causing the route reports
 * page to display the wrong departure date for those bookings.
 *
 * Usage:
 *   ts-node src/scripts/reconcile-route-dates.ts            (dry run, no writes)
 *   ts-node src/scripts/reconcile-route-dates.ts --apply    (perform repairs)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

const sameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

const fmt = (d: Date) => d.toISOString().slice(0, 10);

async function main() {
  console.log(
    `--- Route Date Reconciliation (${APPLY ? "APPLY" : "DRY RUN"}) ---`,
  );

  const bookings = await prisma.booking.findMany({
    where: { travelDate: { not: null } },
    include: { route: true },
  });

  console.log(`Scanning ${bookings.length} bookings with travelDate set...`);

  let mismatched = 0;
  let repaired = 0;
  let unmatched = 0;
  const skippedNoCandidate: string[] = [];

  for (const b of bookings) {
    if (!b.travelDate || !b.route) continue;
    if (sameDay(b.travelDate, b.route.departureDate)) continue;

    mismatched++;

    const travelDate = b.travelDate;
    const startOfDay = new Date(travelDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(travelDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Look for the correct route: same origin/destination, matching travel date.
    // Prefer the same airline if possible.
    const candidates = await prisma.route.findMany({
      where: {
        origin: { equals: b.route.origin, mode: "insensitive" },
        destination: { equals: b.route.destination, mode: "insensitive" },
        departureDate: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: "desc" },
    });

    let target = candidates.find(
      (c) =>
        b.airline &&
        c.airline.toLowerCase() === b.airline.toLowerCase(),
    );
    if (!target) target = candidates[0];

    if (!target) {
      unmatched++;
      skippedNoCandidate.push(
        `  - ${b.passengerName} (${b.id}): travel ${fmt(travelDate)} ${b.route.origin}→${b.route.destination} — currently on route ${b.route.id} (${fmt(b.route.departureDate)}); no candidate route exists for that day.`,
      );
      continue;
    }

    if (target.id === b.route.id) continue;

    console.log(
      `MOVE  ${b.passengerName} (${b.id})  ${b.route.origin}→${b.route.destination}  travel=${fmt(travelDate)}  ${b.route.id} [${fmt(b.route.departureDate)}]  →  ${target.id} [${fmt(target.departureDate)}]`,
    );

    if (APPLY) {
      const seatActive =
        b.status === "CONFIRMED" || b.status === "PENDING" || b.status === "HELD";

      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: b.id },
          data: { routeId: target!.id },
        });

        if (seatActive && !b.route!.isCharter) {
          await tx.route.update({
            where: { id: b.route!.id },
            data: { remainingSeats: { increment: 1 } },
          });
        }
        if (seatActive && !target!.isCharter) {
          await tx.route.update({
            where: { id: target!.id },
            data: { remainingSeats: { decrement: 1 } },
          });
        }
      });
    }

    repaired++;
  }

  console.log("");
  console.log(`Total bookings scanned : ${bookings.length}`);
  console.log(`Date mismatches found  : ${mismatched}`);
  console.log(`Repaired (or planned)  : ${repaired}`);
  console.log(`Unmatched (no target)  : ${unmatched}`);

  if (unmatched > 0) {
    console.log("");
    console.log("Bookings with no matching same-day route:");
    skippedNoCandidate.slice(0, 50).forEach((l) => console.log(l));
    if (skippedNoCandidate.length > 50) {
      console.log(`  ... and ${skippedNoCandidate.length - 50} more`);
    }
  }

  if (!APPLY && repaired > 0) {
    console.log("");
    console.log("DRY RUN — no changes were written. Re-run with --apply to repair.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
