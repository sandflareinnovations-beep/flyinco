const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(r => console.dir(r, { depth: null })).finally(() => prisma.$disconnect());
