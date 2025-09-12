import User from './User.js';
import Event from './Event.js';
import Registration from './Registration.js';

// Associations
User.hasMany(Event, { foreignKey: 'organizerId', as: 'organizedEvents' });
Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

User.belongsToMany(Event, { through: Registration, foreignKey: 'userId', as: 'registrations' });
Event.belongsToMany(User, { through: Registration, foreignKey: 'eventId', as: 'attendees' });

export { User, Event, Registration };
