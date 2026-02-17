module.exports = (sequelize, DataTypes) => {
  const ConsentLog = sequelize.define('ConsentLog', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    scope: { type: DataTypes.STRING(120), allowNull: false },
    granted: { type: DataTypes.BOOLEAN, allowNull: false },
    metadata: { type: DataTypes.JSON }
  }, { tableName: 'consent_logs', updatedAt: false });

  return ConsentLog;
};
