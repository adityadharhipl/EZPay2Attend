const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authenticate } = require('../../middlewares/authenticate');

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

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendeeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
// Process Refund
router.post('/refund', authenticate, paymentsController.processRefund);

module.exports = router;
