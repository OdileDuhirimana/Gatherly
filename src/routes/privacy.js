const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/privacyController');

const router = Router();

router.post('/consents',
  auth(),
  body('scope').isString().isLength({ min: 2 }),
  body('granted').isBoolean(),
  body('metadata').optional().isObject(),
  ctrl.logConsent
);
router.get('/consents/me', auth(), ctrl.listMyConsents);

router.post('/requests/export', auth(), ctrl.requestExport);
router.post('/requests/delete', auth(), ctrl.requestDelete);
router.get('/requests/me', auth(), ctrl.listMyRequests);

router.post('/requests/:id/resolve',
  auth(['Admin']),
  param('id').isInt({ min: 1 }),
  body('status').isIn(['completed', 'rejected']),
  ctrl.resolveRequest
);

router.post('/retention/run', auth(['Admin']), body('days').optional().isInt({ min: 7, max: 3650 }), ctrl.runRetention);

module.exports = router;
