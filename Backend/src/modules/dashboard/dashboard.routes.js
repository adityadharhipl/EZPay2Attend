const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/authenticate');

router.use(authenticate);

router.get('/', authenticate, dashboardController.renderDashboard);
router.get('/profile', authenticate, dashboardController.renderProfile);
router.post('/profile', authenticate, dashboardController.handleUpdateProfile);
router.get('/events', authenticate, dashboardController.getEvents);

module.exports = router;
