const express = require('express');
const router = express.Router();
const attendeesController = require('./attendees.controller');
const { authenticate } = require('../../middlewares/authenticate');

// Public route for frontend registration
router.post('/register', attendeesController.createAttendee);

// Protected routes for admin
router.use(authenticate);
router.get('/', attendeesController.getAllAttendees);
router.patch('/:id/status', attendeesController.updateStatus);
router.delete('/:id', attendeesController.deleteAttendee);

module.exports = router;
