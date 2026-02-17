module.exports = (sequelize, DataTypes) => {
  const OutboxEvent = sequelize.define('OutboxEvent', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventType: { type: DataTypes.STRING(120), allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed'), defaultValue: 'pending' },
    retryCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    nextRetryAt: { type: DataTypes.DATE },
    lastError: { type: DataTypes.TEXT },
    idempotencyKey: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    sentAt: { type: DataTypes.DATE }
  }, { tableName: 'outbox_events' });

  return OutboxEvent;
};
