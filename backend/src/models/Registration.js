import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class Registration extends Model {}

Registration.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'Users', key: 'id' }
    },
    eventId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'Events', key: 'id' }
    },
    status: { type: DataTypes.ENUM('registered','checked_in','cancelled'), defaultValue: 'registered' },
  },
  { sequelize, modelName: 'Registration' }
);

export default Registration;
