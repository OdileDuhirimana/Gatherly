const { Router } = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/teamController');

const router = Router({ mergeParams: true });

router.get('/', auth(), param('eventId').isInt({ min: 1 }), ctrl.listTeam);

router.post('/',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  body('userId').isInt({ min: 1 }),
  body('role').isIn(['Manager', 'Editor', 'Finance', 'Scanner']),
  body('approvalRequired').optional().isBoolean(),
  ctrl.addMember
);

router.delete('/:memberId',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  param('memberId').isInt({ min: 1 }),
  ctrl.removeMember
);

router.get('/approvals/list', auth(), param('eventId').isInt({ min: 1 }), ctrl.listApprovals);

router.post('/approvals/request',
  auth(),
  param('eventId').isInt({ min: 1 }),
  body('actionType').isIn(['event.update', 'ticket.update']),
  body('payload').isObject(),
  ctrl.submitApprovalRequest
);

router.post('/approvals/:id/resolve',
  auth(['Admin', 'Organizer']),
  param('eventId').isInt({ min: 1 }),
  param('id').isInt({ min: 1 }),
  body('status').isIn(['approved', 'rejected']),
  body('note').optional().isString(),
  ctrl.resolveApproval
);

module.exports = router;
