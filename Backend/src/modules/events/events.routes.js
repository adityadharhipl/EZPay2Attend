const express = require('express');
const eventsController = require('./events.controller');
const { authenticate } = require('../../middlewares/authenticate');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Events management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         schoolId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [OPEN, CLOSED, COMPLETED, CANCELLED]
 *         capacity:
 *           type: integer
 *         depositPercentage:
 *           type: number
 *         balanceDueDate:
 *           type: string
 *           format: date-time
 *         costPerAttendee:
 *           type: number
 *         venue:
 *           type: string
 *         type:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of events with pagination
 */
router.get('/', authenticate, eventsController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
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
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', authenticate, eventsController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schoolId
 *               - title
 *               - capacity
 *               - costPerAttendee
 *             properties:
 *               schoolId:
 *                 type: string
 *                 description: UUID of the school
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED, COMPLETED, CANCELLED]
 *               capacity:
 *                 type: integer
 *               depositPercentage:
 *                 type: number
 *               balanceDueDate:
 *                 type: string
 *                 format: date-time
 *               costPerAttendee:
 *                 type: number
 *               venue:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, eventsController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED, COMPLETED, CANCELLED]
 *               capacity:
 *                 type: integer
 *               depositPercentage:
 *                 type: number
 *               balanceDueDate:
 *                 type: string
 *                 format: date-time
 *               costPerAttendee:
 *                 type: number
 *               venue:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 */
router.patch('/:id', authenticate, eventsController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
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
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
router.delete('/:id', authenticate, eventsController.deleteEvent);

module.exports = router;
