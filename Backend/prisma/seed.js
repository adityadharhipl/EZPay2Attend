const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Create a default Admin user
    const adminPassword = await bcrypt.hash('Root@123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'superadmin@ezpay2attend.com' },
        update: {},
        create: {
            email: 'superadmin@ezpay2attend.com',
            name: 'Super Admin',
            password: adminPassword,
            role: 'SUPERADMIN'
        }
    });
    console.log(`Created admin user: ${adminUser.email}`);

    // 2. Create a default School
    const defaultSchool = await prisma.school.upsert({
        where: { email: 'contact@demohigh.edu' },
        update: {},
        create: {
            name: 'Demo High School',
            contactPerson: 'John Doe',
            email: 'contact@demohigh.edu',
            phone: '1234567890',
            address: '123 Education Lane, Demo City'
        }
    });
    console.log(`Created default school: ${defaultSchool.name}`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
