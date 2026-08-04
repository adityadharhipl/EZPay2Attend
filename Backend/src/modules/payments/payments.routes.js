const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment gateway APIs
 */

/**
 * @swagger
 * /api/payments/intent:
 *   post:
 *     summary: Create a payment intent (Paystack)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendeeId:
 *                 type: string
 *               type:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment intent created
 */
// Create payment intent
router.post('/intent', paymentsController.createIntent);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Paystack Webhook
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received
 */
// Paystack Webhook endpoint
router.post('/webhook', paymentsController.paystackWebhook);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get Payment History
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment list
 */
// Get Payment History
router.get('/', paymentsController.getPayments);

module.exports = router;
