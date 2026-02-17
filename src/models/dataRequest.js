module.exports = (sequelize, DataTypes) => {
  const DataRequest = sequelize.define('DataRequest', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM('export', 'delete'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'rejected'), defaultValue: 'pending' },
    payload: { type: DataTypes.JSON },
    resolvedBy: { type: DataTypes.INTEGER.UNSIGNED },
    resolvedAt: { type: DataTypes.DATE }
  }, { tableName: 'data_requests' });

  return DataRequest;
};
