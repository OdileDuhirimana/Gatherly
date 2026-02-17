const { validationResult } = require('express-validator');
const { models } = require('../models');

// List attendees for an event (Organizer/Admin)
const listForEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
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

    // Check availability
    const sold = ticket.sold || 0;
    let waitlisted = false;
    if (ticket.expiresAt && new Date(ticket.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Ticket expired' });
    }

    // Per-user limit
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
      vip: false
    });

    if (!waitlisted) {
      ticket.sold = sold + 1;
      await ticket.save();
    }

    res.status(201).json({ data: attendee });
  } catch (err) { next(err); }
};

// Toggle check-in status for attendee (Organizer/Admin)
const checkInOut = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const attendeeId = parseInt(req.params.attendeeId, 10);

    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const attendee = await models.Attendee.findOne({ where: { id: attendeeId, eventId } });
    if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

    const { checkedIn } = req.body;
    attendee.checkedIn = Boolean(checkedIn);
    await attendee.save();

    res.json({ data: attendee });
  } catch (err) { next(err); }
};

// Remove an attendee (Organizer/Admin); free up a spot and promote from waitlist if any
const remove = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const attendeeId = parseInt(req.params.attendeeId, 10);

    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const attendee = await models.Attendee.findOne({ where: { id: attendeeId, eventId } });
    if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

    // Adjust ticket sold if this attendee was not waitlisted
    const ticket = await models.Ticket.findByPk(attendee.ticketId);
    const wasCounted = attendee.waitlisted === false;
    await attendee.destroy();

    if (ticket && wasCounted && ticket.sold > 0) {
      ticket.sold = ticket.sold - 1;
      await ticket.save();

      // Promote first waitlisted attendee for this ticket
      const nextWait = await models.Attendee.findOne({ where: { eventId, ticketId: ticket.id, waitlisted: true }, order: [['id', 'ASC']] });
      if (nextWait) {
        nextWait.waitlisted = false;
        await nextWait.save();
        ticket.sold = ticket.sold + 1;
        await ticket.save();
      }
    }

    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { listForEvent, register, checkInOut, remove };