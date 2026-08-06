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
 * /admin:
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

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Render reports page
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports page rendered
 */
router.get('/reports', authenticate, dashboardController.renderReports);

/**
 * @swagger
 * /admin/export/custom:
 *   get:
 *     summary: Export custom report
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type of report (e.g., payment, registration)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *         description: Format (json, excel)
 *     responses:
 *       200:
 *         description: Export file or JSON data
 */
router.get('/export/custom', authenticate, dashboardController.exportCustomReport);

/**
 * @swagger
 * /admin/export/attendees:
 *   get:
 *     summary: Export all attendees as Excel
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file download
 */
router.get('/export/attendees', authenticate, dashboardController.exportAttendeesCSV);

/**
 * @swagger
 * /admin/export/payments:
 *   get:
 *     summary: Export all payments as Excel
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file download
 */
router.get('/export/payments', authenticate, dashboardController.exportPaymentsCSV);

module.exports = router;
