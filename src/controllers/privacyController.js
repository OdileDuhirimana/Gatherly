const { validationResult } = require('express-validator');
const { models } = require('../models');
const { logAudit } = require('../utils/audit');

const logConsent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const consent = await models.ConsentLog.create({
      userId: req.user.id,
      scope: req.body.scope,
      granted: req.body.granted,
      metadata: req.body.metadata || null
    });

    res.status(201).json({ data: consent });
  } catch (err) {
    next(err);
  }
};

const listMyConsents = async (req, res, next) => {
  try {
    const consents = await models.ConsentLog.findAll({ where: { userId: req.user.id }, order: [['id', 'DESC']] });
    res.json({ data: consents });
  } catch (err) {
    next(err);
  }
};

const createDataRequest = async (type, req, res, next) => {
  try {
    const existing = await models.DataRequest.findOne({ where: { userId: req.user.id, type, status: 'pending' } });
    if (existing) return res.status(409).json({ error: `Pending ${type} request already exists` });

    const request = await models.DataRequest.create({
      userId: req.user.id,
      type,
      status: 'pending',
      payload: {
        requestedAt: new Date().toISOString(),
        note: req.body?.note || null
      }
    });

    await logAudit({ action: `privacy.request.${type}`, userId: req.user.id, targetType: 'DataRequest', targetId: request.id });
    res.status(201).json({ data: request });
  } catch (err) {
    next(err);
  }
};

const requestExport = async (req, res, next) => createDataRequest('export', req, res, next);
const requestDelete = async (req, res, next) => createDataRequest('delete', req, res, next);

const listMyRequests = async (req, res, next) => {
  try {
    const rows = await models.DataRequest.findAll({ where: { userId: req.user.id }, order: [['id', 'DESC']] });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

const resolveRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id, 10);
    const row = await models.DataRequest.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Data request not found' });
    if (row.status !== 'pending') return res.status(409).json({ error: 'Request already resolved' });

    const { status } = req.body;
    if (status === 'rejected') {
      row.status = 'rejected';
      row.resolvedBy = req.user.id;
      row.resolvedAt = new Date();
      await row.save();
      return res.json({ data: row });
    }

    const user = await models.User.findByPk(row.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (row.type === 'export') {
      const [payments, attendees, comments, consents] = await Promise.all([
        models.Payment.findAll({ where: { userId: user.id } }),
        models.Attendee.findAll({ where: { userId: user.id } }),
        models.Comment.findAll({ where: { userId: user.id } }),
        models.ConsentLog.findAll({ where: { userId: user.id } })
      ]);

      row.payload = {
        ...(row.payload || {}),
        export: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          payments,
          attendees,
          comments,
          consents
        }
      };
    }

    if (row.type === 'delete') {
      await models.Comment.destroy({ where: { userId: user.id } });
      await models.Attendee.destroy({ where: { userId: user.id } });
      await models.ConsentLog.destroy({ where: { userId: user.id } });

      user.name = `deleted-user-${user.id}`;
      user.email = `deleted-${user.id}@privacy.local`;
      user.password = 'deleted';
      user.profilePhoto = null;
      user.preferences = null;
      await user.save();

      row.payload = {
        ...(row.payload || {}),
        deletion: { anonymizedUserId: user.id }
      };
    }

    row.status = 'completed';
    row.resolvedBy = req.user.id;
    row.resolvedAt = new Date();
    await row.save();

    await logAudit({ action: `privacy.request.resolve.${row.type}`, userId: req.user.id, targetType: 'DataRequest', targetId: row.id });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
};

const runRetention = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const days = parseInt(req.body?.days || process.env.DATA_RETENTION_DAYS || '365', 10);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [auditPurged, consentPurged, outboxPurged] = await Promise.all([
      models.AuditLog.destroy({ where: { timestamp: { [models.AuditLog.sequelize.Op.lt]: cutoff } } }),
      models.ConsentLog.destroy({ where: { createdAt: { [models.ConsentLog.sequelize.Op.lt]: cutoff } } }),
      models.OutboxEvent.destroy({ where: { createdAt: { [models.OutboxEvent.sequelize.Op.lt]: cutoff }, status: 'sent' } })
    ]);

    res.json({ data: { days, cutoff, auditPurged, consentPurged, outboxPurged } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  logConsent,
  listMyConsents,
  requestExport,
  requestDelete,
  listMyRequests,
  resolveRequest,
  runRetention
};
