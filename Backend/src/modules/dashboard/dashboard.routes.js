const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/authenticate');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin Dashboard APIs
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Render Dashboard (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard page
 */
router.get('/', authenticate, dashboardController.renderDashboard);

/**
 * @swagger
 * /api/dashboard/profile:
 *   get:
 *     summary: Render Profile (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile page
 */
router.get('/profile', authenticate, dashboardController.renderProfile);

/**
 * @swagger
 * /api/dashboard/profile:
 *   post:
 *     summary: Update Profile
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.post('/profile', authenticate, dashboardController.handleUpdateProfile);

/**
 * @swagger
 * /api/dashboard/events:
 *   get:
 *     summary: Render Events Page (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events page
 */
router.get('/events', authenticate, dashboardController.getEvents);

/**
 * @swagger
 * /api/dashboard/schools:
 *   get:
 *     summary: Render Schools Page (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schools page
 */
router.get('/schools', authenticate, dashboardController.getSchools);

/**
 * @swagger
 * /api/dashboard/attendees:
 *   get:
 *     summary: Render Attendees Page (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendees page
 */
router.get('/attendees', authenticate, dashboardController.getAttendees);

/**
 * @swagger
 * /api/dashboard/payments:
 *   get:
 *     summary: Render Payments Page (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments page
 */
router.get('/payments', authenticate, dashboardController.getPayments);

/**
 * @swagger
 * /api/dashboard/refunds:
 *   get:
 *     summary: Render Refunds Page (HTML)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refunds page
 */
router.get('/refunds', authenticate, dashboardController.getRefunds);

/**
 * @swagger
 * /api/dashboard/export/attendees:
 *   get:
 *     summary: Export Attendees CSV
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 */
router.get('/export/attendees', authenticate, dashboardController.exportAttendeesCSV);

/**
 * @swagger
 * /api/dashboard/export/payments:
 *   get:
 *     summary: Export Payments CSV
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 */
router.get('/export/payments', authenticate, dashboardController.exportPaymentsCSV);

module.exports = router;
