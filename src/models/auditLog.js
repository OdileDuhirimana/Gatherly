module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED },
    targetType: { type: DataTypes.STRING(60) },
    targetId: { type: DataTypes.INTEGER.UNSIGNED },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'audit_logs', updatedAt: false, createdAt: false });
  return AuditLog;
};