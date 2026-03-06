const { PrismaClient } = require('@prisma/client');

// Remote URL provided by user
const REMOTE_URL = "postgres://9114ec42e5d2c415ce3d275021b13c525f3072ac6ddc42e782302f3c13900046:sk_yc_a1oSdjr8XTdHFPKKDP@db.prisma.io:5432/postgres?sslmode=require&pool=true";
// Local URL from .env
const LOCAL_URL = "postgresql://postgres:1234@localhost:5432/flyinco?schema=public";

async function migrate() {
    console.log('🚀 Starting Data Migration: Local -> Remote');

    const localPrisma = new PrismaClient({
        datasources: { db: { url: LOCAL_URL } },
    });

    const remotePrisma = new PrismaClient({
        datasources: { db: { url: REMOTE_URL } },
    });

    try {
        // 1. Fetch Local Data
        console.log('📡 Fetching local data...');
        const users = await localPrisma.user.findMany();
        const routes = await localPrisma.route.findMany();
        const bookings = await localPrisma.booking.findMany();

        console.log(`📦 Found: ${users.length} Users, ${routes.length} Routes, ${bookings.length} Bookings`);

        // 2. Clear Remote Data (Optional but recommended for clean sync)
        console.log('🧹 Preparing remote database...');
        // We use deleteMany to avoid foreign key issues
        await remotePrisma.booking.deleteMany();
        await remotePrisma.route.deleteMany();
        await remotePrisma.user.deleteMany();

        // 3. Migrate Users
        console.log('👤 Migrating Users...');
        for (const user of users) {
            await remotePrisma.user.create({ data: user });
        }

        // 4. Migrate Routes
        console.log('✈️ Migrating Routes...');
        for (const route of routes) {
            await remotePrisma.route.create({ data: route });
        }

        // 5. Migrate Bookings
        console.log('🎫 Migrating Bookings...');
        for (const booking of bookings) {
            await remotePrisma.booking.create({ data: booking });
        }

        console.log('✅ Migration Highly Successful!');
    } catch (error) {
        console.error('❌ Migration Failed:', error);
    } finally {
        await localPrisma.$disconnect();
        await remotePrisma.$disconnect();
    }
}

migrate();
