const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
    const result = await p.route.updateMany({ data: { price: 2000 } });
    console.log('Updated', result.count, 'routes to 2000 SAR');
    await p.$disconnect();
}
main();
