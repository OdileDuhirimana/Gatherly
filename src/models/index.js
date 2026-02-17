const { DataTypes } = require('sequelize');

const models = {};

const setupModels = (sequelize) => {
  models.User = require('./user')(sequelize, DataTypes);
  models.Event = require('./event')(sequelize, DataTypes);
  models.Ticket = require('./ticket')(sequelize, DataTypes);
  models.Payment = require('./payment')(sequelize, DataTypes);
  models.Attendee = require('./attendee')(sequelize, DataTypes);
  models.Notification = require('./notification')(sequelize, DataTypes);
  models.Comment = require('./comment')(sequelize, DataTypes);
  models.AuditLog = require('./auditLog')(sequelize, DataTypes);
};

const associateModels = () => {
  const { User, Event, Ticket, Payment, Attendee, Notification, Comment } = models;

  // Users → Events
  User.hasMany(Event, { foreignKey: 'organizerId', as: 'events' });
  Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

  // Events → Tickets
  Event.hasMany(Ticket, { foreignKey: 'eventId', as: 'tickets' });
  Ticket.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

  // Tickets → Payments (1:N realistically)
  Ticket.hasMany(Payment, { foreignKey: 'ticketId', as: 'payments' });
  Payment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

  // Users → Payments
  User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
  Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Users ↔ Events via Attendees
  User.hasMany(Attendee, { foreignKey: 'userId', as: 'attendances' });
  Event.hasMany(Attendee, { foreignKey: 'eventId', as: 'attendees' });
  Attendee.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Attendee.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
  Attendee.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

  // Notifications
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Event.hasMany(Notification, { foreignKey: 'eventId', as: 'notifications' });
  Notification.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

  // Comments
  Event.hasMany(Comment, { foreignKey: 'eventId', as: 'comments' });
  Comment.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
  User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
  Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

module.exports = { models, setupModels, associateModels };
