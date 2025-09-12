import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;
const dialect = process.env.DB_DIALECT || 'mysql';

let sequelize;
if (dialect === 'sqlite') {
  sequelize = new Sequelize({ dialect: 'sqlite', storage: './sqlite.db', logging: false });
} else if (url) {
  sequelize = new Sequelize(url, { logging: false });
} else {
  throw new Error('Database configuration missing: set DB_DIALECT=sqlite or DATABASE_URL');
}

export { sequelize };
