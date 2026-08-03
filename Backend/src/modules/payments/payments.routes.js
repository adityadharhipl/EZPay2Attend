const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');

// Create payment intent
router.post('/intent', paymentsController.createIntent);

// Paystack Webhook endpoint
router.post('/webhook', paymentsController.paystackWebhook);

module.exports = router;
