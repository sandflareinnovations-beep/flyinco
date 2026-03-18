const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Routes in DB ---');
    let routes = await prisma.route.findMany();
    console.log(routes);

    if (routes.length === 0) {
        console.log('No routes found. Seeding RUH -> COK...');
        const newRoute = await prisma.route.create({
            data: {
                origin: 'RUH',
                destination: 'COK',
                price: 1300,
                totalSeats: 150,
                remainingSeats: 150,
                departureDate: new Date('2026-03-09T00:00:00.000Z'),
                bookingStatus: 'OPEN'
            }
        });
        console.log('Created route:', newRoute.id);
    }

    console.log('--- Bookings in DB ---');
    const bookings = await prisma.booking.findMany();
    console.log(bookings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
