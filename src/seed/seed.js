require('dotenv').config();
const { initDb } = require('../config/database');
const { models } = require('../models');
const { hashPassword } = require('../utils/password');

(async () => {
  try {
    await initDb();

    const adminPass = await hashPassword('Admin@1234');
    const orgPass = await hashPassword('Organizer@1234');
    const attPass = await hashPassword('Attendee@1234');

    await models.User.bulkCreate([
      { name: 'Admin User', email: 'admin@gatherly.local', password: adminPass, role: 'Admin' },
      { name: 'Organizer One', email: 'org1@gatherly.local', password: orgPass, role: 'Organizer' },
      { name: 'Attendee One', email: 'att1@gatherly.local', password: attPass, role: 'Attendee' }
    ], { ignoreDuplicates: true });

    // Minimal sample event
    const organizer = await models.User.findOne({ where: { email: 'org1@gatherly.local' } });
    const event = await models.Event.create({
      organizerId: organizer.id,
      title: 'Sample Event',
      description: 'Welcome to Gatherly',
      category: 'General',
      location: 'Online',
      images: [],
      tags: ['featured'],
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      published: true,
      featured: true
    });

    await models.Ticket.bulkCreate([
      { eventId: event.id, type: 'Regular', price: 25.00, quantity: 100, sold: 0, currency: 'usd' },
      { eventId: event.id, type: 'VIP', price: 100.00, quantity: 20, sold: 0, currency: 'usd' }
    ]);

    // eslint-disable-next-line no-console
    console.log('Seed completed.');
    process.exit(0);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Seed error:', e);
    process.exit(1);
  }
})();
