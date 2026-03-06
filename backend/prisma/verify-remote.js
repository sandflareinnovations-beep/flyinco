const { PrismaClient } = require('@prisma/client');
const REMOTE_URL = "postgres://9114ec42e5d2c415ce3d275021b13c525f3072ac6ddc42e782302f3c13900046:sk_yc_a1oSdjr8XTdHFPKKDP@db.prisma.io:5432/postgres?sslmode=require&pool=true";

async function verify() {
    const prisma = new PrismaClient({ datasources: { db: { url: REMOTE_URL } } });
    try {
        const u = await prisma.user.count();
        const r = await prisma.route.count();
        console.log(`📊 Remote DB Status: ${u} Users, ${r} Routes`);
    } finally {
        await prisma.$disconnect();
    }
}
verify();
