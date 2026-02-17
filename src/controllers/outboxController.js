const { models } = require('../models');
const { processPendingOutbox } = require('../utils/outbox');

const list = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const rows = await models.OutboxEvent.findAll({ where, order: [['id', 'DESC']], limit: 200 });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

const processQueue = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const limit = req.body?.limit ? parseInt(req.body.limit, 10) : 20;
    const results = await processPendingOutbox({ limit });
    res.json({ data: results, meta: { processed: results.length } });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, processQueue };
