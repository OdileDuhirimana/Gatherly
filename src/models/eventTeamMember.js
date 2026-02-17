module.exports = (sequelize, DataTypes) => {
  const EventTeamMember = sequelize.define('EventTeamMember', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    role: { type: DataTypes.ENUM('Manager', 'Editor', 'Finance', 'Scanner'), defaultValue: 'Editor' },
    approvalRequired: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'event_team_members',
    indexes: [{ unique: true, fields: ['eventId', 'userId'] }]
  });

  return EventTeamMember;
};
