const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middlewares/authenticate');

// Note: Using GET since it's a file download via form submission or window.location
// If using AJAX, POST is fine, but for direct download, GET is easier.
router.get('/', authenticate, reportsController.renderReportsPage);
router.get('/download', authenticate, reportsController.downloadReport);

module.exports = router;
