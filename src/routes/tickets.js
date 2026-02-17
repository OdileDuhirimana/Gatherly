const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/ticketController');

const router = Router({ mergeParams: true });

// Public list
router.get('/', param('eventId').isInt(), ctrl.listForEvent);

// Create ticket (Organizer/Admin)
router.post('/',
  auth(['Organizer', 'Admin']),
  param('eventId').isInt(),
  body('type').isIn(['Regular', 'VIP', 'EarlyBird', 'Group']),
  body('price').isFloat({ gt: 0 }),
  body('currency').optional().isString().isLength({ min: 3, max: 10 }),
  body('quantity').isInt({ min: 0 }),
  body('limitPerUser').optional().isInt({ min: 1 }),
  body('expiresAt').optional().isISO8601(),
  body('isDonation').optional().isBoolean(),
  body('isScholarship').optional().isBoolean(),
  body('minDonationAmount').optional().isFloat({ min: 0 }),
  body('refundPolicy').optional().isObject(),
  ctrl.create
);

// Update ticket
router.put('/:ticketId',
  auth(['Organizer', 'Admin']),
  param('eventId').isInt(),
  param('ticketId').isInt(),
  body('type').optional().isIn(['Regular', 'VIP', 'EarlyBird', 'Group']),
  body('price').optional().isFloat({ gt: 0 }),
  body('currency').optional().isString().isLength({ min: 3, max: 10 }),
  body('quantity').optional().isInt({ min: 0 }),
  body('limitPerUser').optional().isInt({ min: 1 }),
  body('expiresAt').optional().isISO8601(),
  body('isDonation').optional().isBoolean(),
  body('isScholarship').optional().isBoolean(),
  body('minDonationAmount').optional().isFloat({ min: 0 }),
  body('refundPolicy').optional().isObject(),
  ctrl.update
);

// Delete ticket
router.delete('/:ticketId', auth(['Organizer', 'Admin']), param('eventId').isInt(), param('ticketId').isInt(), ctrl.remove);

module.exports = router;
