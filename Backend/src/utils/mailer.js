const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, 
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

exports.sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"EZPay2Attend" <${env.EMAIL_FROM}>`,
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
        <p>If you have any pending balance, please log in to complete your payment.</p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};

exports.sendPaymentReceipt = async (attendee, payment, event) => {
    const subject = `Payment Receipt - ${event.title}`;
    const html = `
        <h2>Hello ${attendee.fullName},</h2>
        <p>We have successfully received your payment of <strong>$${payment.amount.toFixed(2)}</strong> for <strong>${event.title}</strong>.</p>
        <p>Transaction Reference: ${payment.referenceNumber}</p>
        <p>Payment Type: ${payment.type}</p>
        <p>Your current status is: <strong>${attendee.status.replace('_', ' ')}</strong></p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};

exports.sendRefundUpdate = async (attendee, event) => {
    const subject = `Update on your Registration - ${event.title}`;
    const html = `
        <h2>Hello ${attendee.fullName},</h2>
        <p>Your registration status for <strong>${event.title}</strong> has been updated to: <strong>REFUNDED</strong>.</p>
        <p>Any applicable funds have been initiated for return to your original payment method. Please allow 3-5 business days for it to reflect in your account.</p>
        <br/>
        <p>Thank you,<br/>EZPay2Attend Team</p>
    `;
    return this.sendEmail(attendee.email, subject, html);
};
