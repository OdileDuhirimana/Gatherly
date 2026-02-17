const { validationResult } = require('express-validator');
const { models } = require('../models');
const { sendEmail } = require('../utils/email');
const { logAudit } = require('../utils/audit');
const { enqueueOutboxEvent } = require('../utils/outbox');

const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await models.Notification.findAll({ where: { userId }, order: [['id', 'DESC']] });
    res.json({ data: notifications });
  } catch (e) { next(e); }
};

const send = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, eventId, type, message, emailSubject } = req.body;

    const notif = await models.Notification.create({ userId: userId || null, eventId: eventId || null, type, message, read: false });

    // Optional email
    if (userId) {
      const user = await models.User.findByPk(userId);
      if (user && user.email) {
        try {
          await sendEmail({ to: user.email, subject: emailSubject || 'Gatherly Notification', text: message });
        } catch (err) {
          // ignore email errors; notification is still stored
        }
      }
    }

    await logAudit({ action: 'notification.send', userId: req.user.id, targetType: 'Notification', targetId: notif.id });
    await enqueueOutboxEvent('notification.sent', {
      notificationId: notif.id,
      type: notif.type,
      userId: notif.userId,
      eventId: notif.eventId
    });
    res.status(201).json({ data: notif });
  } catch (e) { next(e); }
};

const emergencyBroadcast = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const eventId = parseInt(req.body.eventId, 10);
    const event = await models.Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'Admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const attendees = await models.Attendee.findAll({ where: { eventId, waitlisted: false } });
    const userIds = [...new Set(attendees.map((a) => a.userId))];
    const notifications = [];

    for (const userId of userIds) {
      const notif = await models.Notification.create({
        userId,
        eventId,
        type: 'Emergency',
        message: req.body.message,
        read: false
      });
      notifications.push(notif);

      const user = await models.User.findByPk(userId);
      if (user && user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: req.body.emailSubject || `Emergency update for ${event.title}`,
            text: req.body.message
          });
        } catch (err) {
          // best-effort channel
        }
      }
    }

    await logAudit({ action: 'notification.emergency.broadcast', userId: req.user.id, targetType: 'Event', targetId: eventId });
    await enqueueOutboxEvent('notification.emergency.broadcast', {
      eventId,
      recipients: userIds.length,
      triggeredBy: req.user.id
    });

    res.status(201).json({ data: notifications, meta: { recipients: userIds.length } });
  } catch (e) { next(e); }
};

const markRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const notif = await models.Notification.findByPk(id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (notif.userId && notif.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    notif.read = true;
    await notif.save();
    res.json({ data: notif });
  } catch (e) { next(e); }
};

module.exports = { list, send, emergencyBroadcast, markRead };
