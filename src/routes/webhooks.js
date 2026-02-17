const { Router } = require('express');
const ctrl = require('../controllers/webhookController');

const router = Router();

// Stripe webhook endpoint
router.post('/stripe', ctrl.stripeWebhook);

module.exports = router;
