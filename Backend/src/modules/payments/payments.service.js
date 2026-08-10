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
    } else if (event.event === 'charge.failed') {
        const referenceNumber = event.data.reference;

        const payment = await db.payment.findFirst({ where: { referenceNumber } });
        if (!payment) throw new Error("Payment not found");

        if (payment.status !== 'SUCCESS') {
            // Update Payment Status to FAILED
            await db.payment.update({
                where: { id: payment.id },
                data: { status: 'FAILED' }
            });
        }
    }

    return { success: true };
};

exports.verifyPayment = async (referenceNumber) => {
    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${referenceNumber}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`
            }
        });

        if (response.data.status && response.data.data.status === 'success') {
            const payment = await db.payment.findFirst({ where: { referenceNumber } });
            if (!payment || payment.status === 'SUCCESS') return true;

            // Update Payment Status
            await db.payment.update({
                where: { id: payment.id },
                data: { status: 'SUCCESS', paymentDate: new Date() }
            });

            // Update Attendee status
            const attendee = await db.attendee.findUnique({ where: { id: payment.attendeeId } });
            
            if (payment.type === 'DEPOSIT') {
                await db.attendee.update({
                    where: { id: payment.attendeeId },
                    data: { status: 'BALANCE_PENDING' }
                });
            } else if (payment.type === 'BALANCE' || payment.type === 'FULL') {
                await db.attendee.update({
                    where: { id: payment.attendeeId },
                    data: { status: 'CONFIRMED' }
                });
            }

            const eventData = await db.event.findUnique({ where: { id: attendee.eventId } });
            const mailer = require('../../utils/mailer');
            mailer.sendPaymentReceipt(attendee, payment, eventData).catch(e => console.error("Email Error:", e));

            return true;
        }
    } catch (error) {
        console.error("Paystack Verify Error:", error.response?.data || error.message);
    }
    return false;
};

exports.processRefund = async (attendeeId) => {
    // 1. Get attendee and their successful payments
    const attendee = await db.attendee.findUnique({ 
        where: { id: attendeeId },
        include: { payments: { where: { status: 'SUCCESS' } } }
    });
    
    if (!attendee) throw new Error("Attendee not found");
    if (attendee.payments.length === 0) throw new Error("No successful payments found to refund");

    // 2. Call Paystack Refund API for each payment (simplified for MVP)
    // Normally we'd do a loop or sum the amounts, but here we refund all successful payments
    for (const payment of attendee.payments) {
        try {
            await axios.post('https://api.paystack.co/refund', {
                transaction: payment.referenceNumber
            }, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Record the refund in DB
            await db.payment.create({
                data: {
                    attendeeId,
                    type: 'REFUND',
                    amount: payment.amount,
                    status: 'SUCCESS',
                    referenceNumber: `REF-${Date.now()}`
                }
            });
        } catch (error) {
            console.error(`Refund failed for payment ${payment.referenceNumber}:`, error.response?.data || error.message);
            throw new Error("Failed to process refund with Paystack");
        }
    }

    // 3. Update Attendee status
    await db.attendee.update({
        where: { id: attendeeId },
        data: { status: 'REFUNDED' }
    });

    // Automatically Reopen Vacant Seat if event was closed
    const eventCheck = await db.event.findUnique({
        where: { id: attendee.eventId },
        include: { 
            _count: { 
                select: { attendees: { where: { status: { notIn: ['REFUNDED', 'REPLACED'] } } } } 
            } 
        }
    });

    if (eventCheck && eventCheck.status === 'CLOSED' && eventCheck._count.attendees < eventCheck.capacity) {
        await db.event.update({
            where: { id: eventCheck.id },
            data: { status: 'OPEN' }
        });
    }

    // 4. Send Email
    const eventData = await db.event.findUnique({ where: { id: attendee.eventId } });
    const mailer = require('../../utils/mailer');
    mailer.sendRefundUpdate(attendee, eventData).catch(e => console.error("Email Error:", e));

    return { success: true, message: "Refund processed successfully" };
};

exports.rejectRefund = async (attendeeId) => {
    const attendee = await db.attendee.findUnique({
        where: { id: attendeeId },
        include: { event: true }
    });

    if (!attendee) throw new Error("Attendee not found");
    if (attendee.status !== 'REFUND_REQUESTED') throw new Error("No refund requested for this attendee");

    // Revert status to CONFIRMED (since they must have paid something to request a refund)
    await db.attendee.update({
        where: { id: attendeeId },
        data: { status: 'CONFIRMED' }
    });

    // Send Rejection Email
    const mailer = require('../../utils/mailer');
    mailer.sendRefundRejection(attendee, attendee.event).catch(e => console.error("Email Error:", e));

    return { success: true, message: "Refund rejected successfully" };
};
