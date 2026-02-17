const { validationResult } = require('express-validator');
const { models } = require('../models');

const listForEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const tickets = await models.Ticket.findAll({ where: { eventId } });
    res.json({ data: tickets });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.params.eventId, 10);
    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = {
      eventId,
      type: req.body.type,
      price: req.body.price,
      currency: req.body.currency || 'usd',
      quantity: req.body.quantity,
      limitPerUser: req.body.limitPerUser || 10,
      expiresAt: req.body.expiresAt || null
    };

    const ticket = await models.Ticket.create(payload);
    res.status(201).json({ data: ticket });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { eventId, ticketId } = req.params;
    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const ticket = await models.Ticket.findOne({ where: { id: ticketId, eventId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const updatable = ['type', 'price', 'currency', 'quantity', 'limitPerUser', 'expiresAt'];
    for (const k of updatable) if (k in req.body) ticket[k] = req.body[k];
    await ticket.save();
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { eventId, ticketId } = req.params;
    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const ticket = await models.Ticket.findOne({ where: { id: ticketId, eventId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    await ticket.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { listForEvent, create, update, remove };
