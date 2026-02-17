module.exports = (sequelize, DataTypes) => {
  const Attendee = sequelize.define('Attendee', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ticketId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    checkedIn: { type: DataTypes.BOOLEAN, defaultValue: false },
    waitlisted: { type: DataTypes.BOOLEAN, defaultValue: false },
    vip: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'attendees' });
  return Attendee;
};