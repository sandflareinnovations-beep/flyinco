const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Check if route already exists
    const existing = await prisma.route.findFirst({
        where: { origin: 'RUH', destination: 'COK' }
    });

    if (!existing) {
        await prisma.route.create({
            data: {
                origin: 'RUH',
                destination: 'COK',
                price: 24500,
                totalSeats: 150,
                remainingSeats: 45,
                departureDate: new Date('2026-03-09T11:35:00.000Z'),
            }
        });
        console.log('✅ Seeded: RUH → COK Saudia special fare');
    } else {
        console.log('ℹ️  Route already exists, skipping seed.');
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
