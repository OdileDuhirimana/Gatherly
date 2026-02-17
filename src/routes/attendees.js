const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/attendeeController');

const router = Router({ mergeParams: true });

// List attendees for an event (Organizer/Admin)
router.get('/', auth(['Admin', 'Organizer']), ctrl.listForEvent);

// Register current user as attendee for a ticket
router.post('/register',
  auth(),
  body('ticketId').isInt({ min: 1 }),
  ctrl.register
);

// Check-in/out attendee
router.post('/:attendeeId/checkin',
  auth(['Admin', 'Organizer']),
  param('attendeeId').isInt({ min: 1 }),
  body('checkedIn').isBoolean(),
  ctrl.checkInOut
);

// Remove attendee
router.delete('/:attendeeId',
  auth(['Admin', 'Organizer']),
  param('attendeeId').isInt({ min: 1 }),
  ctrl.remove
);

module.exports = router;