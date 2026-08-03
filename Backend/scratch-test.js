const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log('1. Requesting password reset for admin@ezpay2attend.com...');
    const res1 = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: 'admin@ezpay2attend.com' })
    });
    const data1 = await res1.json();
    console.log('Forgot Password Response:', data1);

    console.log('\n2. Fetching token from DB (simulating clicking link in Ethereal email)...');
    const user = await prisma.user.findUnique({ where: { email: 'admin@ezpay2attend.com' } });
    if (!user || !user.resetToken) {
        console.error('No reset token found in DB!');
        return;
    }
    console.log('Token found:', user.resetToken);

    console.log('\n3. Sending new password to reset endpoint...');
    const res2 = await fetch('http://localhost:5000/api/auth/reset-password/' + user.resetToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ password: 'TestPassword123!' })
    });
    const data2 = await res2.json();
    console.log('Reset Password Response:', data2);
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
