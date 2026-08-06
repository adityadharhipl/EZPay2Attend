const express = require('express');
const router = express.Router();
const attendeesController = require('./attendees.controller');
const { authenticate } = require('../../middlewares/authenticate');

/**
 * @swagger
 * tags:
 *   name: Attendees
 *   description: Attendee management APIs
 */

/**
 * @swagger
 * /api/attendees/register:
 *   post:
 *     summary: Register a new attendee
 *     tags: [Attendees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendee registered successfully
 *       400:
 *         description: Bad request
 */
// Public route for frontend registration
router.post('/register', attendeesController.createAttendee);

// Protected routes for admin
router.use(authenticate);

/**
 * @swagger
 * /api/attendees/{id}/request-refund:
 *   post:
 *     summary: Request a refund (simulate)
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund requested successfully
 *       400:
 *         description: Bad request
 */
router.post('/:id/request-refund', attendeesController.requestRefund);

/**
 * @swagger
 * /api/attendees/reminders/balance:
 *   post:
 *     summary: Send balance reminders to all pending attendees
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminders sent successfully
 */
router.post('/reminders/balance', attendeesController.sendBalanceReminders);

/**
 * @swagger
 * /api/attendees/{id}/reminders/balance:
 *   post:
 *     summary: Send individual balance reminder
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reminder sent successfully
 */
router.post('/:id/reminders/balance', attendeesController.sendIndividualReminder);

/**
 * @swagger
 * /api/attendees:
 *   get:
 *     summary: Get all attendees
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *     responses:
 *       200:
 *         description: List of attendees
 */
router.get('/', attendeesController.getAllAttendees);

/**
 * @swagger
 * /api/attendees/{id}/status:
 *   patch:
 *     summary: Update attendee status
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', attendeesController.updateStatus);

/**
 * @swagger
 * /api/attendees/{id}:
 *   delete:
 *     summary: Delete an attendee
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendee deleted
 */
router.delete('/:id', attendeesController.deleteAttendee);

module.exports = router;
