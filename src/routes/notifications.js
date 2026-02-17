const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/notificationController');

const router = Router();

// List my notifications
router.get('/', auth(), ctrl.list);

// Send a notification (Organizer/Admin)
router.post('/send',
  auth(['Organizer', 'Admin']),
  body('type').isString().isLength({ min: 2 }),
  body('message').isString().isLength({ min: 1 }),
  body('userId').optional().isInt(),
  body('eventId').optional().isInt(),
  body('emailSubject').optional().isString(),
  ctrl.send
);

// Mark as read
router.post('/:id/read', auth(), param('id').isInt(), ctrl.markRead);

module.exports = router;
