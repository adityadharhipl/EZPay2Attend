const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    console.log('Testing login...');
    const user = await prisma.user.findUnique({ where: { email: 'admin@ezpay2attend.com' } });
    if (!user) {
        console.log('User not found!');
        return;
    }
    console.log('User found:', user.email);
    const valid = await bcrypt.compare('password123', user.password);
    console.log('Password valid:', valid);
}

test().catch(console.error).finally(() => prisma.$disconnect());
