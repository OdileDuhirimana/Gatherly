const { models } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const eventStats = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = await models.Event.findByPk(eventId, { include: [{ model: models.Ticket, as: 'tickets' }] });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    // RBAC: organizer or admin
    if (req.user && req.user.role !== 'Admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const tickets = event.tickets || [];
    const sold = tickets.reduce((acc, t) => acc + (t.sold || 0), 0);
    const capacity = tickets.reduce((acc, t) => acc + (t.quantity || 0), 0);

    // Revenue from payments succeeded
    const payments = await models.Payment.findAll({
      include: [{ model: models.Ticket, as: 'ticket', where: { eventId } }],
      where: { status: { [Op.in]: ['succeeded', 'refunded', 'partial_refund'] } }
    });
    const grossRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    const attendance = await models.Attendee.count({ where: { eventId } });
    const checkedIn = await models.Attendee.count({ where: { eventId, checkedIn: true } });

    res.json({ data: { sold, capacity, grossRevenue, attendance, checkedIn } });
  } catch (e) { next(e); }
};

const usersMetrics = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const usersCount = await models.User.count();
    const eventsCount = await models.Event.count();
    const paymentsCount = await models.Payment.count({ where: { status: { [Op.in]: ['succeeded', 'refunded', 'partial_refund'] } } });
    res.json({ data: { usersCount, eventsCount, paymentsCount } });
  } catch (e) { next(e); }
};

module.exports = { eventStats, usersMetrics };
