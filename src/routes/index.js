const { Router } = require('express');
const authRoutes = require('./auth');
const eventRoutes = require('./events');
const ticketRoutes = require('./tickets');
const paymentRoutes = require('./payments');
const attendeeRoutes = require('./attendees');
const notificationRoutes = require('./notifications');
const commentRoutes = require('./comments');
const analyticsRoutes = require('./analytics');
const webhookRoutes = require('./webhooks');

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/events/:eventId/tickets', ticketRoutes);
router.use('/events/:eventId/attendees', attendeeRoutes);
router.use('/events/:eventId/comments', commentRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);

router.get('/', (req, res) => res.json({ name: 'Gatherly API', version: '0.1.0' }));

module.exports = router;
