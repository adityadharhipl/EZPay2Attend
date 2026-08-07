const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

router.get('/register', publicController.renderRegisterPage);
router.get('/event/:slug/register', publicController.renderSingleEventRegisterPage);
router.get('/checkout', publicController.renderCheckoutPage);
router.get('/school/:id/dashboard', publicController.renderSchoolDashboard);
// Can add landing page router.get('/', ...) here later

module.exports = router;
