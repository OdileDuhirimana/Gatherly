const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const initDb = async () => {
  if (!sequelize) {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: { underscored: false, freezeTableName: false },
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
      }
    );

    // Import models and set associations
    const { setupModels, associateModels } = require('../models');
    setupModels(sequelize);
    associateModels();
  }

  // Test connection and sync in dev/test
  await sequelize.authenticate();
  if (['development', 'test'].includes(process.env.NODE_ENV)) {
    await sequelize.sync();
  }
  return sequelize;
};

const getSequelize = () => {
  if (!sequelize) throw new Error('Sequelize not initialized. Call initDb() first.');
  return sequelize;
};

module.exports = { initDb, getSequelize };
