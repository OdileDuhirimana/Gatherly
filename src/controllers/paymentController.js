const { validationResult } = require('express-validator');
const { models } = require('../models');
const { getStripe } = require('../utils/stripe');
const crypto = require('crypto');

const canManagePayment = async (req, payment) => {
  if (req.user.role === 'Admin') return true;
  // Organizer of the event can manage
  const ticket = await models.Ticket.findByPk(payment.ticketId, { include: [{ model: models.Event, as: 'event' }] });
  if (!ticket) return false;
  return ticket.event && ticket.event.organizerId === req.user.id;
};

const listByUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (req.user.role !== 'Admin' && req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const payments = await models.Payment.findAll({ where: { userId } });
    res.json({ data: payments });
  } catch (err) {
    next(err);
  }
};

const purchase = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const ticketId = parseInt(req.params.ticketId, 10);
    const quantity = parseInt(req.body.quantity, 10);

    const ticket = await models.Ticket.findByPk(ticketId, { include: [{ model: models.Event, as: 'event' }] });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const event = ticket.event;
    if (!event || !event.published) return res.status(400).json({ error: 'Event not available' });

    // Expiry and availability checks
    if (ticket.expiresAt && new Date(ticket.expiresAt) < new Date()) return res.status(400).json({ error: 'Ticket expired' });
    if (ticket.sold + quantity > ticket.quantity) return res.status(400).json({ error: 'Not enough tickets available' });

    // Per-user limit check (count existing attendees with this ticket)
    const userCount = await models.Attendee.count({ where: { userId: req.user.id, ticketId } });
    if (userCount + quantity > ticket.limitPerUser) {
      return res.status(400).json({ error: 'Purchase exceeds per-user limit' });
    }

    // Stripe PaymentIntent
    const stripeSecret = process.env.STRIPE_SECRET;
    if (!stripeSecret) return res.status(500).json({ error: 'Payments not configured' });
    const stripe = getStripe();

    const amountCents = Math.round(Number(ticket.price) * 100) * quantity; // simplistic; assumes single price per ticket
    const currency = ticket.currency || (process.env.CURRENCY || 'usd');

    const idemKey = req.header('Idempotency-Key') || crypto.randomUUID();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: { ticketId: String(ticket.id), eventId: String(event.id), userId: String(req.user.id), quantity: String(quantity) }
    }, { idempotencyKey: idemKey });

    // Record pending payment
    const payment = await models.Payment.create({
      ticketId: ticket.id,
      userId: req.user.id,
      amount: (Number(ticket.price) * quantity).toFixed(2),
      currency,
      status: 'pending',
      stripePaymentId: intent.id
    });

    res.status(201).json({ clientSecret: intent.client_secret, paymentId: payment.id });
  } catch (err) {
    next(err);
  }
};

const refund = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id, 10);
    const payment = await models.Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const allowed = await canManagePayment(req, payment);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const stripeSecret = process.env.STRIPE_SECRET;
    if (!stripeSecret) return res.status(500).json({ error: 'Payments not configured' });
    const stripe = getStripe();

    // Create refund in Stripe
    await stripe.refunds.create({ payment_intent: payment.stripePaymentId });

    payment.status = 'refunded';
    await payment.save();

    res.json({ data: payment });
  } catch (err) {
    next(err);
  }
};

module.exports = { listByUser, purchase, refund };
