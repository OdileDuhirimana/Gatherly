const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/eventController');

const router = Router();

// Public list and get
router.get('/', ctrl.list);
router.get('/:id', param('id').isInt(), ctrl.getOne);

// Organizer/Admin create
router.post('/',
  auth(['Organizer', 'Admin']),
  body('title').isString().isLength({ min: 3 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('category').optional().isString(),
  body('location').optional().isString(),
  body('images').optional().isArray(),
  body('tags').optional().isArray(),
  body('recurringRule').optional().isString(),
  ctrl.create
);

// Update
router.put('/:id',
  auth(['Organizer', 'Admin']),
  param('id').isInt(),
  body('title').optional().isString().isLength({ min: 3 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('category').optional().isString(),
  body('location').optional().isString(),
  body('images').optional().isArray(),
  body('tags').optional().isArray(),
  body('recurringRule').optional().isString(),
  body('published').optional().isBoolean(),
  body('featured').optional().isBoolean(),
  ctrl.update
);

// Delete
router.delete('/:id', auth(['Organizer', 'Admin']), param('id').isInt(), ctrl.remove);

module.exports = router;
