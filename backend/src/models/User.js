import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin','organizer','attendee'), allowNull: false, defaultValue: 'attendee' },
  },
  { sequelize, modelName: 'User' }
);

export default User;
