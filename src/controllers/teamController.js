const { validationResult } = require('express-validator');
const { models } = require('../models');
const { logAudit } = require('../utils/audit');
const { getEventAndRoleContext } = require('../utils/eventAccess');

const ensureOwnerOrAdmin = async (eventId, user) => {
  const event = await models.Event.findByPk(eventId);
  if (!event) return { error: 'Event not found', status: 404 };
  if (user.role !== 'Admin' && event.organizerId !== user.id) return { error: 'Forbidden', status: 403 };
  return { event };
};

const ensureManagerAccess = async (eventId, user) => {
  const context = await getEventAndRoleContext({ eventId, user });
  if (context.error) return context;
  if (!context.canManage) return { error: 'Forbidden', status: 403 };
  if (!['Admin', 'Organizer', 'Manager'].includes(context.role || '')) return { error: 'Forbidden', status: 403 };
  return context;
};

const listTeam = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureManagerAccess(eventId, req.user);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const members = await models.EventTeamMember.findAll({
      where: { eventId },
      include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['id', 'ASC']]
    });

    res.json({ data: members });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureOwnerOrAdmin(eventId, req.user);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const user = await models.User.findByPk(req.body.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [member] = await models.EventTeamMember.findOrCreate({
      where: { eventId, userId: req.body.userId },
      defaults: {
        eventId,
        userId: req.body.userId,
        role: req.body.role,
        approvalRequired: !!req.body.approvalRequired
      }
    });

    if (member.role !== req.body.role || member.approvalRequired !== !!req.body.approvalRequired) {
      member.role = req.body.role;
      member.approvalRequired = !!req.body.approvalRequired;
      await member.save();
    }

    await logAudit({ action: 'team.member.upsert', userId: req.user.id, targetType: 'EventTeamMember', targetId: member.id });
    res.status(201).json({ data: member });
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const memberId = parseInt(req.params.memberId, 10);
    const access = await ensureOwnerOrAdmin(eventId, req.user);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const member = await models.EventTeamMember.findOne({ where: { id: memberId, eventId } });
    if (!member) return res.status(404).json({ error: 'Team member not found' });

    await member.destroy();
    await logAudit({ action: 'team.member.remove', userId: req.user.id, targetType: 'EventTeamMember', targetId: memberId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const submitApprovalRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const context = await getEventAndRoleContext({ eventId, user: req.user });
    if (context.error) return res.status(context.status).json({ error: context.error });
    if (!context.canManage) return res.status(403).json({ error: 'Forbidden' });

    const approval = await models.ApprovalRequest.create({
      eventId,
      requestedBy: req.user.id,
      actionType: req.body.actionType,
      payload: req.body.payload,
      status: 'pending'
    });

    await logAudit({ action: 'approval.request.create', userId: req.user.id, targetType: 'ApprovalRequest', targetId: approval.id });
    res.status(201).json({ data: approval });
  } catch (err) {
    next(err);
  }
};

const listApprovals = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureManagerAccess(eventId, req.user);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const rows = await models.ApprovalRequest.findAll({ where: { eventId }, order: [['id', 'DESC']] });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

const resolveApproval = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const id = parseInt(req.params.id, 10);
    const access = await ensureOwnerOrAdmin(eventId, req.user);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const approval = await models.ApprovalRequest.findOne({ where: { id, eventId } });
    if (!approval) return res.status(404).json({ error: 'Approval request not found' });
    if (approval.status !== 'pending') return res.status(409).json({ error: 'Approval already resolved' });

    approval.status = req.body.status;
    approval.reviewedBy = req.user.id;
    approval.reviewNote = req.body.note || null;
    approval.reviewedAt = new Date();
    await approval.save();

    if (approval.status === 'approved') {
      if (approval.actionType === 'event.update') {
        const event = await models.Event.findByPk(eventId);
        if (event) {
          const allowed = ['title', 'description', 'category', 'location', 'images', 'tags', 'accessibility', 'startDate', 'endDate', 'recurringRule', 'published', 'featured'];
          for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(approval.payload || {}, key)) {
              event[key] = approval.payload[key];
            }
          }
          await event.save();
        }
      }

      if (approval.actionType === 'ticket.update') {
        const ticketId = approval.payload?.ticketId;
        if (ticketId) {
          const ticket = await models.Ticket.findOne({ where: { id: ticketId, eventId } });
          if (ticket) {
            const allowed = ['type', 'price', 'currency', 'quantity', 'limitPerUser', 'expiresAt', 'isDonation', 'isScholarship', 'minDonationAmount', 'refundPolicy'];
            for (const key of allowed) {
              if (Object.prototype.hasOwnProperty.call(approval.payload || {}, key)) {
                ticket[key] = approval.payload[key];
              }
            }
            await ticket.save();
          }
        }
      }
    }

    await logAudit({ action: 'approval.request.resolve', userId: req.user.id, targetType: 'ApprovalRequest', targetId: approval.id });
    res.json({ data: approval });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTeam,
  addMember,
  removeMember,
  submitApprovalRequest,
  listApprovals,
  resolveApproval
};
