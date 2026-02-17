module.exports = (sequelize, DataTypes) => {
  const WaitlistOffer = sequelize.define('WaitlistOffer', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ticketId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    attendeeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    token: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('pending', 'claimed', 'expired'), defaultValue: 'pending' },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    claimedAt: { type: DataTypes.DATE }
  }, { tableName: 'waitlist_offers' });

  return WaitlistOffer;
};
