const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating routes...');
    await prisma.route.updateMany({
        data: {
            remainingSeats: 150,
            bookingStatus: 'OPEN'
        }
    });

    const routes = await prisma.route.findMany();
    console.log(routes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
