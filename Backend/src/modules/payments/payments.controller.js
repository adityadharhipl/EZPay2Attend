const paymentsService = require('./payments.service');

exports.createIntent = async (req, res) => {
    try {
        const { attendeeId, type, amount } = req.body;
        const paystackData = await paymentsService.createPaymentIntent(attendeeId, type, amount);
        res.status(201).json({ success: true, data: paystackData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.paystackWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-paystack-signature'];
        if (!signature) {
            return res.status(400).send('No signature found');
        }

        await paymentsService.processWebhook(req.body, signature);
        // Respond 200 immediately to acknowledge receipt to Paystack
        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error("Webhook error:", error.message);
        res.status(400).send(error.message);
    }
};
