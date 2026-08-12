const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');

// Protect all settings routes
router.use(authenticate);

router.get('/', settingsController.getSettings);
router.post('/', settingsController.updateSettings);

module.exports = router;
