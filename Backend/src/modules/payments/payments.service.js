const db = require('../../config/db');
const axios = require('axios');
const env = require('../../config/env');
const crypto = require('crypto');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder_key_here';
const CURRENCY = process.env.PAYSTACK_CURRENCY || 'ZAR';

exports.createPaymentIntent = async (attendeeId, type, amount) => {
    // Check attendee
    const attendee = await db.attendee.findUnique({ where: { id: attendeeId } });
    if (!attendee) throw new Error("Attendee not found");

    const referenceNumber = `EZPAY-${Date.now()}`;

    // Create a pending payment record
    const payment = await db.payment.create({
        data: {
            attendeeId,
            type, // DEPOSIT or BALANCE
            amount: parseFloat(amount),
            status: "PENDING",
            referenceNumber
        }
    });

    try {
        // Amount in Paystack must be in smallest currency unit (e.g. Kobo, Cents) -> multiply by 100
        const paystackAmount = Math.round(amount * 100);

        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: attendee.email,
                amount: paystackAmount,
                reference: referenceNumber,
                currency: CURRENCY,
                callback_url: `${env.API_BASE_URL}/checkout?attendeeId=${attendeeId}` // Redirect back after payment
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.status) {
            return {
                authorization_url: response.data.data.authorization_url,
                referenceNumber: referenceNumber,
                paymentId: payment.id
            };
        } else {
            throw new Error('Failed to initialize Paystack transaction');
        }
    } catch (error) {
        console.error("Paystack Init Error:", error.response?.data || error.message);
        throw new Error("Failed to initialize payment gateway. Please check API keys.");
    }
};

exports.processWebhook = async (reqBody, rawBody, signature) => {
    // 1. Verify Paystack Signature
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBody).digest('hex');
    if (hash !== signature) {
        throw new Error("Invalid Paystack Signature");
    }

    // 2. Parse Event
    const event = reqBody;
    
    if (event.event === 'charge.success') {
        const referenceNumber = event.data.reference;
        const status = 'SUCCESS';

        const payment = await db.payment.findFirst({ where: { referenceNumber } });
        if (!payment) throw new Error("Payment not found");

        // Prevent double processing
        if (payment.status === 'SUCCESS') return { success: true };

        // Update Payment Status
        await db.payment.update({
            where: { id: payment.id },
            data: { status, paymentDate: new Date() }
        });

        // Update Attendee status based on payment type
        const attendee = await db.attendee.findUnique({ where: { id: payment.attendeeId } });
        
        if (payment.type === 'DEPOSIT') {
            await db.attendee.update({
                where: { id: payment.attendeeId },
                data: { status: 'BALANCE_PENDING' }
            });
            attendee.status = 'BALANCE_PENDING';
        } else if (payment.type === 'BALANCE' || payment.type === 'FULL') {
            await db.attendee.update({
                where: { id: payment.attendeeId },
                data: { status: 'CONFIRMED' }
            });
            attendee.status = 'CONFIRMED';
        }

        const eventData = await db.event.findUnique({ where: { id: attendee.eventId } });
        const mailer = require('../../utils/mailer');
        mailer.sendPaymentReceipt(attendee, payment, eventData).catch(e => console.error("Email Error:", e));
    }

    return { success: true };
};
