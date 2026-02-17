const { validationResult } = require('express-validator');
const { models } = require('../models');
const { Op } = require('sequelize');
const { getStripe } = require('../utils/stripe');
const { computeRefund } = require('../utils/refundPolicy');
const { evaluatePurchaseRisk } = require('../utils/risk');
const { enqueueOutboxEvent } = require('../utils/outbox');
const crypto = require('crypto');

const canManagePayment = async (req, payment) => {
  if (req.user.role === 'Admin') return true;
  const ticket = await models.Ticket.findByPk(payment.ticketId, { include: [{ model: models.Event, as: 'event' }] });
  if (!ticket) return false;
  return ticket.event && ticket.event.organizerId === req.user.id;
};

const listByUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (req.user.role !== 'Admin' && req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const payments = await models.Payment.findAll({ where: { userId }, order: [['id', 'DESC']] });
    res.json({ data: payments });
  } catch (err) {
    next(err);
  }
};

const listFlagged = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const payments = await models.Payment.findAll({
      where: {
        riskLevel: { [Op.in]: ['medium', 'high'] }
      },
      order: [['id', 'DESC']],
      limit: 100
    });
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
    const donationAmount = Number(req.body.donationAmount || 0);

    const ticket = await models.Ticket.findByPk(ticketId, { include: [{ model: models.Event, as: 'event' }] });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const event = ticket.event;
    if (!event || !event.published) return res.status(400).json({ error: 'Event not available' });

    if (ticket.expiresAt && new Date(ticket.expiresAt) < new Date()) return res.status(400).json({ error: 'Ticket expired' });
    if (ticket.sold + quantity > ticket.quantity) return res.status(400).json({ error: 'Not enough tickets available' });

    const userCount = await models.Attendee.count({ where: { userId: req.user.id, ticketId } });
    if (userCount + quantity > ticket.limitPerUser) {
      return res.status(400).json({ error: 'Purchase exceeds per-user limit' });
    }

    if (ticket.isDonation && donationAmount < Number(ticket.minDonationAmount || 0)) {
      return res.status(400).json({ error: `Donation ticket requires minimum donation of ${ticket.minDonationAmount}` });
    }

    const risk = await evaluatePurchaseRisk({ userId: req.user.id, ticket, quantity, donationAmount });

    const amount = Number(ticket.price) * quantity + donationAmount;
    const currency = ticket.currency || (process.env.CURRENCY || 'usd');

    // High risk payments are captured for manual review before charging card.
    if (risk.level === 'high') {
      const reviewPayment = await models.Payment.create({
        ticketId: ticket.id,
        userId: req.user.id,
        amount: amount.toFixed(2),
        donationAmount: donationAmount.toFixed(2),
        currency,
        status: 'pending',
        paymentType: donationAmount > 0 ? 'ticket+donation' : 'ticket',
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFlags: risk.flags
      });

      await enqueueOutboxEvent('payment.review.required', {
        paymentId: reviewPayment.id,
        userId: req.user.id,
        ticketId: ticket.id,
        risk
      });

      return res.status(202).json({
        message: 'Payment queued for manual fraud review',
        paymentId: reviewPayment.id,
        risk
      });
    }

    const stripeSecret = process.env.STRIPE_SECRET;
    if (!stripeSecret) return res.status(500).json({ error: 'Payments not configured' });
    const stripe = getStripe();

    const amountCents = Math.round(amount * 100);
    const idemKey = req.header('Idempotency-Key') || crypto.randomUUID();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        ticketId: String(ticket.id),
        eventId: String(event.id),
        userId: String(req.user.id),
        quantity: String(quantity),
        donationAmount: String(donationAmount)
      }
    }, { idempotencyKey: idemKey });

    const payment = await models.Payment.create({
      ticketId: ticket.id,
      userId: req.user.id,
      amount: amount.toFixed(2),
      donationAmount: donationAmount.toFixed(2),
      currency,
      status: 'pending',
      stripePaymentId: intent.id,
      paymentType: donationAmount > 0 ? 'ticket+donation' : 'ticket',
      riskScore: risk.score,
      riskLevel: risk.level,
      riskFlags: risk.flags
    });

    res.status(201).json({
      clientSecret: intent.client_secret,
      paymentId: payment.id,
      risk
    });
  } catch (err) {
    next(err);
  }
};

const refundPreview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payment = await models.Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const allowed = await canManagePayment(req, payment);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const ticket = await models.Ticket.findByPk(payment.ticketId, { include: [{ model: models.Event, as: 'event' }] });
    if (!ticket || !ticket.event) return res.status(404).json({ error: 'Ticket/event not found' });

    const preview = computeRefund({ ticket, event: ticket.event, payment });
    res.json({ data: preview });
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

    const ticket = await models.Ticket.findByPk(payment.ticketId, { include: [{ model: models.Event, as: 'event' }] });
    if (!ticket || !ticket.event) return res.status(404).json({ error: 'Ticket/event not found' });

    const decision = computeRefund({ ticket, event: ticket.event, payment });
    if (!decision.eligible) {
      return res.status(400).json({ error: decision.reason || 'Refund not eligible', data: decision });
    }

    const stripeSecret = process.env.STRIPE_SECRET;
    if (!stripeSecret) return res.status(500).json({ error: 'Payments not configured' });
    const stripe = getStripe();

    const amountCents = Math.round(decision.refundAmount * 100);
    await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: amountCents
    });

    const currentRefunded = Number(payment.refundedAmount || 0);
    const newRefunded = Math.round((currentRefunded + decision.refundAmount) * 100) / 100;
    payment.refundedAmount = newRefunded.toFixed(2);

    const paidAmount = Number(payment.amount || 0);
    payment.status = newRefunded >= paidAmount ? 'refunded' : 'partial_refund';
    await payment.save();

    await enqueueOutboxEvent('payment.refund.processed', {
      paymentId: payment.id,
      refundedAmount: decision.refundAmount,
      cumulativeRefunded: newRefunded,
      status: payment.status
    });

    res.json({ data: payment, refund: decision });
  } catch (err) {
    next(err);
  }
};

module.exports = { listByUser, listFlagged, purchase, refundPreview, refund };
