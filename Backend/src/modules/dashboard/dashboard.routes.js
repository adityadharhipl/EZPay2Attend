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

router.get('/profile', authenticate, dashboardController.renderProfile);
router.post('/profile', authenticate, dashboardController.handleUpdateProfile);
router.get('/events', authenticate, dashboardController.getEvents);
router.get('/schools', authenticate, dashboardController.getSchools);
router.get('/attendees', authenticate, dashboardController.getAttendees);
router.get('/payments', authenticate, dashboardController.getPayments);
router.get('/refunds', authenticate, dashboardController.getRefunds);

router.get('/export/attendees', authenticate, dashboardController.exportAttendeesCSV);
router.get('/export/payments', authenticate, dashboardController.exportPaymentsCSV);

module.exports = router;
