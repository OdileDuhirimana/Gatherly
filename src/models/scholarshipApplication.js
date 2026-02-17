module.exports = (sequelize, DataTypes) => {
  const ScholarshipApplication = sequelize.define('ScholarshipApplication', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ticketId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    motivation: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    reviewedBy: { type: DataTypes.INTEGER.UNSIGNED },
    reviewNote: { type: DataTypes.TEXT },
    reviewedAt: { type: DataTypes.DATE }
  }, { tableName: 'scholarship_applications' });

  return ScholarshipApplication;
};
