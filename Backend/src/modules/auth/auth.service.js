const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const env = require('../../config/env');

// Note: Email transport mock. In real app, use nodemailer here.
exports.loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid email or password');
    }
    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '1d' });
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { token, user: userData };
};

const nodemailer = require('nodemailer');

exports.generateResetToken = async (email, req) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('User with that email does not exist');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
    });

    // Also pointing it to the frontend view for password reset
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    console.log('RESET URL: ', resetUrl);
    
    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'admin@ezpay2attend.com',
        to: user.email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click this link to reset it: ${resetUrl}`,
        html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });
    
    return resetUrl;
};

exports.validateResetToken = async (token) => {
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: { gt: new Date() }
        }
    });
    if (!user) throw new Error('Invalid or expired reset token');
    return user;
};

exports.resetPassword = async (user, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });
};
