const { validationResult } = require('express-validator');
const { models } = require('../models');
const { sendEmail } = require('../utils/email');
const { logAudit } = require('../utils/audit');

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
    res.status(201).json({ data: notif });
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

module.exports = { list, send, markRead };
