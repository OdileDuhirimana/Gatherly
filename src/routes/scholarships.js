const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/scholarshipController');

const router = Router({ mergeParams: true });

router.post('/tickets/:ticketId/apply',
  auth(),
  param('eventId').isInt({ min: 1 }),
  param('ticketId').isInt({ min: 1 }),
  body('motivation').isString().isLength({ min: 10, max: 2000 }),
  ctrl.apply
);

router.get('/', auth(['Admin', 'Organizer']), param('eventId').isInt({ min: 1 }), ctrl.listForEvent);

router.post('/:id/review',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  param('id').isInt({ min: 1 }),
  body('status').isIn(['approved', 'rejected']),
  body('note').optional().isString().isLength({ min: 2 }),
  ctrl.review
);

module.exports = router;
