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

// Claim waitlist offer
router.post('/waitlist/claim',
  auth(),
  param('eventId').isInt({ min: 1 }),
  body('token').isString().isLength({ min: 10 }),
  ctrl.claimWaitlistOffer
);

// List waitlist offers for event
router.get('/waitlist/offers',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  ctrl.listWaitlistOffers
);

// Scan signed QR token and check-in attendee
router.post('/scan/checkin',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  body('token').isString().isLength({ min: 20 }),
  ctrl.scanCheckIn
);

// Check-in/out attendee manually
router.post('/:attendeeId/checkin',
  auth(['Admin', 'Organizer']),
  param('attendeeId').isInt({ min: 1 }),
  body('checkedIn').isBoolean(),
  ctrl.checkInOut
);

// Update my safety status for emergency workflows
router.post('/me/safety',
  auth(),
  param('eventId').isInt({ min: 1 }),
  body('status').isIn(['unknown', 'safe', 'need_help']),
  ctrl.updateMySafetyStatus
);

// Safety summary for organizers/admin
router.get('/safety/summary',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  ctrl.safetySummary
);

// Remove attendee
router.delete('/:attendeeId',
  auth(['Admin', 'Organizer']),
  param('attendeeId').isInt({ min: 1 }),
  ctrl.remove
);

module.exports = router;
