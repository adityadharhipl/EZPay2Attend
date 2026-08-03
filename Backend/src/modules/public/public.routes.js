const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

router.get('/register', publicController.renderRegisterPage);
router.get('/checkout', publicController.renderCheckoutPage);
// Can add landing page router.get('/', ...) here later

module.exports = router;
