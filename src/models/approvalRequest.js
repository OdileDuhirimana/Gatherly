module.exports = (sequelize, DataTypes) => {
  const ApprovalRequest = sequelize.define('ApprovalRequest', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    requestedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    actionType: { type: DataTypes.STRING(80), allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    reviewedBy: { type: DataTypes.INTEGER.UNSIGNED },
    reviewNote: { type: DataTypes.TEXT },
    reviewedAt: { type: DataTypes.DATE }
  }, { tableName: 'approval_requests' });

  return ApprovalRequest;
};
