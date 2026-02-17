const { validationResult } = require('express-validator');
const { models } = require('../models');
const { logAudit } = require('../utils/audit');

const ensureEventManager = async ({ eventId, user }) => {
  const event = await models.Event.findByPk(eventId);
  if (!event) return { error: 'Event not found', status: 404 };
  if (user.role === 'Admin' || event.organizerId === user.id) return { event };

  const team = await models.EventTeamMember.findOne({ where: { eventId, userId: user.id } });
  if (!team || !['Manager', 'Editor'].includes(team.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { event, team };
};

const apply = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const ticketId = parseInt(req.params.ticketId, 10);
    const ticket = await models.Ticket.findOne({ where: { id: ticketId, eventId }, include: [{ model: models.Event, as: 'event' }] });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!ticket.isScholarship) return res.status(400).json({ error: 'Ticket does not support scholarship applications' });
    if (!ticket.event || !ticket.event.published) return res.status(400).json({ error: 'Event not available' });

    const exists = await models.ScholarshipApplication.findOne({
      where: { eventId, ticketId, userId: req.user.id, status: 'pending' }
    });
    if (exists) return res.status(409).json({ error: 'Pending scholarship application already exists' });

    const app = await models.ScholarshipApplication.create({
      eventId,
      ticketId,
      userId: req.user.id,
      motivation: req.body.motivation,
      status: 'pending'
    });

    await logAudit({ action: 'scholarship.apply', userId: req.user.id, targetType: 'ScholarshipApplication', targetId: app.id });
    res.status(201).json({ data: app });
  } catch (err) {
    next(err);
  }
};

const listForEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureEventManager({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const apps = await models.ScholarshipApplication.findAll({
      where: { eventId },
      include: [{ model: models.User, as: 'user', attributes: ['id', 'name', 'email'] }, { model: models.Ticket, as: 'ticket' }],
      order: [['id', 'DESC']]
    });

    res.json({ data: apps });
  } catch (err) {
    next(err);
  }
};

const review = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const id = parseInt(req.params.id, 10);
    const access = await ensureEventManager({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const app = await models.ScholarshipApplication.findOne({ where: { id, eventId } });
    if (!app) return res.status(404).json({ error: 'Scholarship application not found' });
    if (app.status !== 'pending') return res.status(409).json({ error: 'Application already reviewed' });

    const { status, note } = req.body;
    app.status = status;
    app.reviewNote = note || null;
    app.reviewedBy = req.user.id;
    app.reviewedAt = new Date();
    await app.save();

    if (status === 'approved') {
      const ticket = await models.Ticket.findByPk(app.ticketId);
      if (ticket) {
        const waitlisted = (ticket.sold || 0) + 1 > ticket.quantity;
        const attendee = await models.Attendee.create({
          userId: app.userId,
          eventId: app.eventId,
          ticketId: app.ticketId,
          checkedIn: false,
          waitlisted,
          vip: ticket.type === 'VIP',
          safetyStatus: 'unknown'
        });
        if (!waitlisted) {
          ticket.sold = (ticket.sold || 0) + 1;
          await ticket.save();
        }

        await models.Notification.create({
          userId: app.userId,
          eventId,
          type: 'Scholarship',
          message: waitlisted
            ? 'Your scholarship was approved. You are currently waitlisted due to capacity.'
            : 'Your scholarship was approved and your attendee pass is active.',
          read: false
        });

        await logAudit({ action: 'scholarship.approved', userId: req.user.id, targetType: 'Attendee', targetId: attendee.id });
      }
    }

    await logAudit({ action: 'scholarship.review', userId: req.user.id, targetType: 'ScholarshipApplication', targetId: app.id });
    res.json({ data: app });
  } catch (err) {
    next(err);
  }
};

module.exports = { apply, listForEvent, review };
