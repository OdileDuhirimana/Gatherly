module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    ticketId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'usd' },
    status: { type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded', 'partial_refund'), defaultValue: 'pending' },
    stripePaymentId: { type: DataTypes.STRING(120) }
  }, { tableName: 'payments' });
  return Payment;
};