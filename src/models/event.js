module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    organizerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING(100) },
    location: { type: DataTypes.STRING(200) },
    images: { type: DataTypes.JSON },
    tags: { type: DataTypes.JSON },
    accessibility: { type: DataTypes.JSON },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    recurringRule: { type: DataTypes.STRING(200) },
    published: { type: DataTypes.BOOLEAN, defaultValue: false },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'events' });
  return Event;
};
