const { validationResult } = require('express-validator');
const { models } = require('../models');
const { Op } = require('sequelize');
const { logAudit } = require('../utils/audit');
const { getEventAndRoleContext } = require('../utils/eventAccess');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, category, featured, published, accessibilityNeed } = req.query;
    const where = {};
    if (q) {
      where.title = { [Op.like]: `%${q}%` };
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

    let data = rows;
    let total = count;
    if (accessibilityNeed) {
      const need = String(accessibilityNeed).toLowerCase();
      data = rows.filter((event) => {
        const features = event.accessibility?.features || [];
        return Array.isArray(features) && features.some((item) => String(item).toLowerCase().includes(need));
      });
      total = data.length;
    }

    res.json({ data, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total } });
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
      accessibility: req.body.accessibility || null,
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

    const context = await getEventAndRoleContext({ eventId: event.id, user: req.user });
    if (!context.canManage) return res.status(403).json({ error: 'Forbidden' });

    const teamRole = context.role;
    if (!['Admin', 'Organizer', 'Manager', 'Editor'].includes(teamRole || '')) {
      return res.status(403).json({ error: 'Role cannot update event directly' });
    }

    // Team members can be configured to require approval before changes are applied.
    if (context.approvalRequired) {
      const approval = await models.ApprovalRequest.create({
        eventId: event.id,
        requestedBy: req.user.id,
        actionType: 'event.update',
        payload: req.body,
        status: 'pending'
      });
      await logAudit({ action: 'approval.request.create', userId: req.user.id, targetType: 'ApprovalRequest', targetId: approval.id });
      return res.status(202).json({
        message: 'Update submitted for approval',
        approvalId: approval.id,
        status: approval.status
      });
    }

    const updatable = ['title', 'description', 'category', 'location', 'images', 'tags', 'accessibility', 'startDate', 'endDate', 'recurringRule', 'published', 'featured'];
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

const getAccessibility = async (req, res, next) => {
  try {
    const event = await models.Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ data: event.accessibility || {} });
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

module.exports = { list, getOne, create, update, remove, getAccessibility };
