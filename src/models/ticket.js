module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    type: { type: DataTypes.ENUM('Regular', 'VIP', 'EarlyBird', 'Group'), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'usd' },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    sold: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    limitPerUser: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 10 },
    expiresAt: { type: DataTypes.DATE },
    uniqueCode: { type: DataTypes.STRING(64) }
  }, { tableName: 'tickets' });
  return Ticket;
};