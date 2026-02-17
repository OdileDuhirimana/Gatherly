module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(200), allowNull: false },
    role: { type: DataTypes.ENUM('Admin', 'Organizer', 'Attendee'), defaultValue: 'Attendee' },
    profilePhoto: { type: DataTypes.STRING(255) },
    preferences: { type: DataTypes.JSON }
  }, {
    tableName: 'users'
  });
  return User;
};
