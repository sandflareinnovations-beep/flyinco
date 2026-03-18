const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'sabith@flyinco.com';
    const password = '98768';

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
        // Update role to ADMIN and reset password
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashed, role: 'ADMIN', name: 'Sabith Admin' }
        });
        console.log('✅ Updated existing user to ADMIN:', email);
    } else {
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                name: 'Sabith Admin',
                email,
                password: hashed,
                role: 'ADMIN',
            }
        });
        console.log('✅ Admin user created:', email);
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
