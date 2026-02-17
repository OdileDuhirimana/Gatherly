const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const toBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const inferDialect = () => {
  if (process.env.DB_DIALECT) return process.env.DB_DIALECT;
  if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://')) return 'postgres';
    if (process.env.DATABASE_URL.startsWith('mysql://')) return 'mysql';
  }
  return 'mysql';
};

const buildSequelizeConfig = () => {
  const dialect = inferDialect();
  const logging = process.env.NODE_ENV === 'development' ? console.log : false;
  const useSsl = toBool(process.env.DB_SSL, process.env.NODE_ENV === 'production' && dialect === 'postgres');

  const baseConfig = {
    dialect,
    logging,
    define: { underscored: false, freezeTableName: false },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  };

  if (dialect === 'postgres' && useSsl) {
    baseConfig.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: false }
    };
  }

  if (process.env.DATABASE_URL) {
    return { dbUrl: process.env.DATABASE_URL, config: baseConfig };
  }

  return {
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    config: {
      ...baseConfig,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (dialect === 'postgres' ? 5432 : 3306)
    }
  };
};

const initDb = async () => {
  if (!sequelize) {
    const settings = buildSequelizeConfig();
    if (settings.dbUrl) {
      sequelize = new Sequelize(settings.dbUrl, settings.config);
    } else {
      sequelize = new Sequelize(settings.dbName, settings.dbUser, settings.dbPassword, settings.config);
    }

    // Import models and set associations
    const { setupModels, associateModels } = require('../models');
    setupModels(sequelize);
    associateModels();
  }

  // Authenticate connection in every environment.
  await sequelize.authenticate();

  // Auto-sync in development/test or when explicitly enabled.
  const shouldSync = ['development', 'test'].includes(process.env.NODE_ENV) || toBool(process.env.DB_SYNC, false);
  if (shouldSync) await sequelize.sync();

  return sequelize;
};

const getSequelize = () => {
  if (!sequelize) throw new Error('Sequelize not initialized. Call initDb() first.');
  return sequelize;
};

module.exports = { initDb, getSequelize };
