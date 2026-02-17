const { validationResult } = require('express-validator');
const { models } = require('../models');
const { logAudit } = require('../utils/audit');
const { signCheckInToken, verifyCheckInToken } = require('../utils/checkinToken');
const { promoteNextFromWaitlist, claimWaitlistOffer: claimOfferFromWaitlist, expireOffers } = require('../utils/waitlist');
const { enqueueOutboxEvent } = require('../utils/outbox');

const ensureEventManageAccess = async ({ eventId, user }) => {
  const event = await models.Event.findByPk(eventId);
  if (!event) return { error: 'Event not found', status: 404 };
  if (user.role !== 'Admin' && event.organizerId !== user.id) {
    return { error: 'Forbidden', status: 403 };
  }
  return { event };
};

// List attendees for an event (Organizer/Admin)
const listForEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureEventManageAccess({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const attendees = await models.Attendee.findAll({ where: { eventId } });
    res.json({ data: attendees });
  } catch (err) { next(err); }
};

// Register current user to a ticket for an event
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const { ticketId } = req.body;
    const event = await models.Event.findByPk(eventId);
    if (!event || !event.published) return res.status(400).json({ error: 'Event not available' });

    const ticket = await models.Ticket.findOne({ where: { id: ticketId, eventId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found for this event' });

    const sold = ticket.sold || 0;
    let waitlisted = false;
    if (ticket.expiresAt && new Date(ticket.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Ticket expired' });
    }

    const userCount = await models.Attendee.count({ where: { userId: req.user.id, ticketId } });
    if (userCount + 1 > ticket.limitPerUser) {
      return res.status(400).json({ error: 'Registration exceeds per-user limit' });
    }

    if (sold + 1 > ticket.quantity) {
      waitlisted = true;
    }

    const attendee = await models.Attendee.create({
      userId: req.user.id,
      eventId,
      ticketId,
      checkedIn: false,
      waitlisted,
      vip: false,
      safetyStatus: 'unknown'
    });

    if (!waitlisted) {
      ticket.sold = sold + 1;
      await ticket.save();
    }

    const checkInToken = signCheckInToken({ attendeeId: attendee.id, eventId, ticketId });

    if (waitlisted) {
      await models.Notification.create({
        userId: req.user.id,
        eventId,
        type: 'Waitlist',
        message: 'You are now on the waitlist. We will notify you when a spot opens.',
        read: false
      });
    }

    await logAudit({ action: 'attendee.register', userId: req.user.id, targetType: 'Attendee', targetId: attendee.id });

    res.status(201).json({
      data: attendee,
      checkInToken,
      meta: {
        waitlisted
      }
    });
  } catch (err) { next(err); }
};

// Claim waitlist offer (Attendee)
const claimWaitlistOffer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const { token } = req.body;
    const result = await claimOfferFromWaitlist({ token, userId: req.user.id });
    if (result.error) return res.status(result.status || 400).json({ error: result.error });

    if (result.attendee.eventId !== eventId) {
      return res.status(400).json({ error: 'Offer does not belong to this event' });
    }

    await logAudit({ action: 'attendee.waitlist.claim', userId: req.user.id, targetType: 'WaitlistOffer', targetId: result.offer.id });

    const checkInToken = signCheckInToken({
      attendeeId: result.attendee.id,
      eventId: result.attendee.eventId,
      ticketId: result.attendee.ticketId
    });

    res.json({ data: result.attendee, checkInToken, offer: result.offer });
  } catch (err) { next(err); }
};

// List waitlist offers for event (Organizer/Admin)
const listWaitlistOffers = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureEventManageAccess({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    await expireOffers({ eventId });

    const offers = await models.WaitlistOffer.findAll({
      where: { eventId },
      include: [{ model: models.Attendee, as: 'attendee' }, { model: models.Ticket, as: 'ticket' }],
      order: [['id', 'DESC']]
    });

    res.json({ data: offers });
  } catch (err) { next(err); }
};

// Toggle check-in status for attendee (Organizer/Admin)
const checkInOut = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const attendeeId = parseInt(req.params.attendeeId, 10);

    const access = await ensureEventManageAccess({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const attendee = await models.Attendee.findOne({ where: { id: attendeeId, eventId } });
    if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

    const { checkedIn } = req.body;
    attendee.checkedIn = Boolean(checkedIn);
    await attendee.save();
    await logAudit({ action: 'attendee.checkin.manual', userId: req.user.id, targetType: 'Attendee', targetId: attendee.id });

    await enqueueOutboxEvent('attendee.checkin.manual', {
      attendeeId: attendee.id,
      eventId,
      checkedIn: attendee.checkedIn,
      operatorId: req.user.id
    });

    res.json({ data: attendee });
  } catch (err) { next(err); }
};

// Check-in attendee via signed QR token (Organizer/Admin scanner flow)
const scanCheckIn = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureEventManageAccess({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const { token } = req.body;
    let payload;
    try {
      payload = verifyCheckInToken(token);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired check-in token' });
    }

    if (Number(payload.eventId) !== eventId) {
      return res.status(400).json({ error: 'Token does not belong to this event' });
    }

    const attendee = await models.Attendee.findOne({ where: { id: Number(payload.attendeeId), eventId } });
    if (!attendee) return res.status(404).json({ error: 'Attendee not found' });
    if (attendee.waitlisted) return res.status(409).json({ error: 'Waitlisted attendee cannot be checked in' });
    if (attendee.checkedIn) return res.status(409).json({ error: 'Attendee already checked in', data: attendee });

    attendee.checkedIn = true;
    await attendee.save();
    await logAudit({ action: 'attendee.checkin.scan', userId: req.user.id, targetType: 'Attendee', targetId: attendee.id });

    await enqueueOutboxEvent('attendee.checkin.scan', {
      attendeeId: attendee.id,
      eventId,
      operatorId: req.user.id,
      scannedAt: new Date().toISOString()
    });

    res.json({
      data: attendee,
      meta: {
        method: 'qr-signed-token',
        scannedAt: new Date().toISOString()
      }
    });
  } catch (err) { next(err); }
};

// Attendee updates own emergency safety status
const updateMySafetyStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const attendee = await models.Attendee.findOne({ where: { eventId, userId: req.user.id } });
    if (!attendee) return res.status(404).json({ error: 'Attendee record not found for this event' });

    attendee.safetyStatus = req.body.status;
    attendee.safetyUpdatedAt = new Date();
    await attendee.save();

    await logAudit({ action: 'attendee.safety.update', userId: req.user.id, targetType: 'Attendee', targetId: attendee.id });

    res.json({ data: attendee });
  } catch (err) { next(err); }
};

// Safety summary for organizers/admin
const safetySummary = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const access = await ensureEventManageAccess({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const attendees = await models.Attendee.findAll({ where: { eventId } });
    const summary = attendees.reduce((acc, a) => {
      const key = a.safetyStatus || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { unknown: 0, safe: 0, need_help: 0 });

    res.json({ data: summary });
  } catch (err) { next(err); }
};

// Remove an attendee (Organizer/Admin); free up a spot and create waitlist claim offer
const remove = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const attendeeId = parseInt(req.params.attendeeId, 10);

    const access = await ensureEventManageAccess({ eventId, user: req.user });
    if (access.error) return res.status(access.status).json({ error: access.error });

    const attendee = await models.Attendee.findOne({ where: { id: attendeeId, eventId } });
    if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

    const ticket = await models.Ticket.findByPk(attendee.ticketId);
    const wasCounted = attendee.waitlisted === false;
    await attendee.destroy();

    if (ticket && wasCounted && ticket.sold > 0) {
      ticket.sold = ticket.sold - 1;
      await ticket.save();

      const offer = await promoteNextFromWaitlist({ eventId, ticketId: ticket.id });
      if (offer) {
        const nextAttendee = await models.Attendee.findByPk(offer.attendeeId);
        if (nextAttendee) {
          await models.Notification.create({
            userId: nextAttendee.userId,
            eventId,
            type: 'WaitlistOffer',
            message: `A ticket spot is now available. Claim within ${process.env.WAITLIST_OFFER_EXPIRES_MIN || '60'} minutes using offer token ${offer.token}.`,
            read: false
          });
        }
      }
    }

    await logAudit({ action: 'attendee.remove', userId: req.user.id, targetType: 'Attendee', targetId: attendeeId });
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = {
  listForEvent,
  register,
  claimWaitlistOffer,
  listWaitlistOffers,
  checkInOut,
  scanCheckIn,
  updateMySafetyStatus,
  safetySummary,
  remove
};
