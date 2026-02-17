const { validationResult } = require('express-validator');
const { models } = require('../models');

const listForEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const comments = await models.Comment.findAll({ where: { eventId }, order: [['id', 'DESC']], include: [{ model: models.User, as: 'user', attributes: ['id','name'] }] });
    res.json({ data: comments });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const eventId = parseInt(req.params.eventId, 10);
    const { content, rating } = req.body;
    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const comment = await models.Comment.create({ eventId, userId: req.user.id, content, rating });
    res.status(201).json({ data: comment });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const id = parseInt(req.params.id, 10);
    const comment = await models.Comment.findOne({ where: { id, eventId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (req.user.role !== 'Admin' && comment.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await comment.destroy();
    res.status(204).send();
  } catch (e) { next(e); }
};

module.exports = { listForEvent, create, remove };
