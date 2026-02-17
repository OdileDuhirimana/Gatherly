const { validationResult } = require('express-validator');
const { models } = require('../models');
const { logAudit } = require('../utils/audit');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, category, featured, published } = req.query;
    const where = {};
    if (q) {
      where.title = { [models.Event.sequelize.Op.like]: `%${q}%` };
    }
    if (category) where.category = category;
    if (featured !== undefined) where.featured = featured === 'true';
    if (published !== undefined) where.published = published === 'true';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { rows, count } = await models.Event.findAndCountAll({
      where,
      order: [['startDate', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
      include: [{ model: models.User, as: 'organizer', attributes: ['id', 'name', 'email'] }]
    });
    res.json({ data: rows, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: count } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const event = await models.Event.findByPk(req.params.id, {
      include: [
        { model: models.User, as: 'organizer', attributes: ['id', 'name'] },
        { model: models.Ticket, as: 'tickets' }
      ]
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ data: event });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const payload = {
      organizerId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      images: req.body.images || [],
      tags: req.body.tags || [],
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      recurringRule: req.body.recurringRule || null,
      published: !!req.body.published,
      featured: !!req.body.featured
    };

    const event = await models.Event.create(payload);
    await logAudit({ action: 'event.create', userId: req.user.id, targetType: 'Event', targetId: event.id });
    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const event = await models.Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Only organizer that owns it or admin
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatable = ['title', 'description', 'category', 'location', 'images', 'tags', 'startDate', 'endDate', 'recurringRule', 'published', 'featured'];
    for (const key of updatable) {
      if (key in req.body) event[key] = req.body[key];
    }
    await event.save();
    await logAudit({ action: 'event.update', userId: req.user.id, targetType: 'Event', targetId: event.id });
    res.json({ data: event });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const event = await models.Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await event.destroy();
    await logAudit({ action: 'event.delete', userId: req.user.id, targetType: 'Event', targetId: event.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, update, remove };
