import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class Event extends Model {}

Event.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    dateTime: { type: DataTypes.DATE, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    maxAttendees: { type: DataTypes.INTEGER, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    organizerId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Event' }
);

export default Event;
