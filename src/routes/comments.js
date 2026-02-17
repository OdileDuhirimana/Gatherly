const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/commentController');

const router = Router({ mergeParams: true });

router.get('/', param('eventId').isInt(), ctrl.listForEvent);

router.post('/',
  auth(),
  param('eventId').isInt(),
  body('content').isString().isLength({ min: 1 }),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  ctrl.create
);

router.delete('/:id', auth(), param('eventId').isInt(), param('id').isInt(), ctrl.remove);

module.exports = router;
