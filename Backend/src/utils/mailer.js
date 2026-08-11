const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"EZPay2Attend" <${process.env.EMAIL_FROM || 'noreply@ezpay2attend.com'}>`,
            to,
            subject,
            html: htmlContent,
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

exports.sendRegistrationEmail = async (attendee, event) => {
    const subject = `Registration Successful - ${event.title}`;
    const html = `
        <h2>Hello ${attendee.fullName},</h2>
        <p>You have successfully registered for <strong>${event.title}</strong>.</p>
        <p>Your current status is: <strong>${attendee.status.replace('_', ' ')}</strong></p>
        <p>If you have any pending balance, please click the link below to complete your payment.</p>
        <p><a href="${env.API_BASE_URL}/checkout?attendeeId=${attendee.id}"><strong>Click here to pay now</strong></a></p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};

exports.sendPaymentReceipt = async (attendee, payment, event) => {
    const subject = `Payment Successful! - ${event.title}`;
    const html = `
        <h1 style="color: #4ade80;">Payment Successful! 🎉</h1>
        <h2>Hello ${attendee.fullName},</h2>
        <p>We have successfully received your payment of <strong>$${payment.amount.toFixed(2)}</strong> for <strong>${event.title}</strong>.</p>
        <p>Transaction Reference: ${payment.referenceNumber}</p>
        <p>Payment Type: ${payment.type}</p>
        <p>Your current status is: <strong>${attendee.status.replace('_', ' ')}</strong></p>
        ${attendee.status === 'BALANCE_PENDING' ? `<br/><p>To complete your remaining balance, please click the link below:</p><p><a href="${env.API_BASE_URL}/checkout?attendeeId=${attendee.id}"><strong>Click here to pay your balance</strong></a></p>` : ''}
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};

exports.sendRefundUpdate = async (attendee, event) => {
    const subject = `Refund Approval - ${event.title}`;
    const html = `
        <h2>Hello ${attendee.fullName},</h2>
        <p>Your registration status for <strong>${event.title}</strong> has been updated to: <strong>REFUNDED</strong>.</p>
        <p>Any applicable funds have been initiated for return to your original payment method. Please allow 3-5 business days for it to reflect in your account.</p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};

exports.sendBalanceReminder = async (attendee, event) => {
    const subject = `Action Required: Balance Payment Reminder - ${event.title}`;
    const amountDue = (event.costPerAttendee - (event.costPerAttendee * (event.depositPercentage / 100))).toFixed(2);
    const html = `
        <h2>Hello ${attendee.fullName},</h2>
        <p>This is a friendly reminder that you have a pending balance of <strong>$${amountDue}</strong> for <strong>${event.title}</strong>.</p>
        <p>Please log in or visit the checkout page to complete your payment before the due date to secure your spot.</p>
        <p><a href="${env.API_BASE_URL}/checkout?attendeeId=${attendee.id}">Click here to pay your balance</a></p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};

exports.sendRefundRejection = async (attendee, event) => {
    const subject = `Refund Rejection - ${event.title}`;
    const html = `
        <h2>Hello ${attendee.fullName},</h2>
        <p>We are writing to inform you that your recent refund request for <strong>${event.title}</strong> has been reviewed and unfortunately declined.</p>
        <p>Your registration status remains as <strong>CONFIRMED</strong>.</p>
        <p>If you have any questions or require further clarification, please do not hesitate to contact our support team.</p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};
