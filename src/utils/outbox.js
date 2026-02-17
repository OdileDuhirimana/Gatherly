const crypto = require('crypto');
const { models } = require('../models');

const enqueueOutboxEvent = async (eventType, payload) => {
  return models.OutboxEvent.create({
    eventType,
    payload,
    idempotencyKey: crypto.randomUUID(),
    status: 'pending',
    retryCount: 0,
    nextRetryAt: new Date()
  });
};

const processPendingOutbox = async ({ limit = 20 } = {}) => {
  const maxRetries = parseInt(process.env.OUTBOX_MAX_RETRIES || '5', 10);
  const targetUrl = process.env.WEBHOOK_TARGET_URL;

  const items = await models.OutboxEvent.findAll({
    where: {
      status: { [models.OutboxEvent.sequelize.Op.in]: ['pending', 'failed'] },
      retryCount: { [models.OutboxEvent.sequelize.Op.lt]: maxRetries },
      nextRetryAt: { [models.OutboxEvent.sequelize.Op.lte]: new Date() }
    },
    order: [['id', 'ASC']],
    limit
  });

  const results = [];

  for (const item of items) {
    try {
      item.status = 'processing';
      await item.save();

      if (!targetUrl) throw new Error('WEBHOOK_TARGET_URL not configured');

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-idempotency-key': item.idempotencyKey,
          'x-outbox-event-type': item.eventType
        },
        body: JSON.stringify(item.payload || {})
      });

      if (!response.ok) {
        throw new Error(`Webhook target responded ${response.status}`);
      }

      item.status = 'sent';
      item.sentAt = new Date();
      item.lastError = null;
      await item.save();
      results.push({ id: item.id, status: 'sent' });
    } catch (error) {
      item.status = 'failed';
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastError = error.message;
      const backoffMinutes = Math.min(60, 2 ** item.retryCount);
      item.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      await item.save();
      results.push({ id: item.id, status: 'failed', error: error.message });
    }
  }

  return results;
};

module.exports = { enqueueOutboxEvent, processPendingOutbox };
