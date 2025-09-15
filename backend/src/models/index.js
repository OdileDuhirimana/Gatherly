import User from './User.js';
import Event from './Event.js';
import Registration from './Registration.js';

// Initialize models first
console.log('Initializing models...');

// Associations
User.hasMany(Event, { foreignKey: 'organizerId', as: 'organizedEvents' });
Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

// Registration associations
User.hasMany(Registration, { foreignKey: 'userId', as: 'registrations' });
Registration.belongsTo(User, { foreignKey: 'userId', as: 'attendee' });

Event.hasMany(Registration, { foreignKey: 'eventId', as: 'registrations' });
Registration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

console.log('Models initialized successfully');

export { User, Event, Registration };
