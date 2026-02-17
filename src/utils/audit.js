const { models } = require('../models');

const logAudit = async ({ action, userId, targetType, targetId }) => {
  try {
    await models.AuditLog.create({ action, userId: userId || null, targetType: targetType || null, targetId: targetId || null });
  } catch (e) {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'test') console.error('Audit log error:', e.message);
  }
};

module.exports = { logAudit };
