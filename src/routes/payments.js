const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/paymentController');

const router = Router();

// Get payments by user (self or admin)
router.get('/:userId', auth(), param('userId').isInt(), ctrl.listByUser);

// Purchase ticket -> returns clientSecret for PaymentIntent
router.post('/purchase/:ticketId',
  auth(),
  param('ticketId').isInt(),
  body('quantity').isInt({ min: 1, max: 10 }),
  ctrl.purchase
);

// Refund payment (Admin or Organizer that owns event)
router.post('/refund/:id', auth(), param('id').isInt(), ctrl.refund);

module.exports = router;
