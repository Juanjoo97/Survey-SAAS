import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Survey } from '../models/Survey';
import { Question } from '../models/Question';
import { SurveyResponse } from '../models/SurveyResponse';
import { Answer } from '../models/Answer';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const dialect = (process.env.DB_DIALECT as any) || 'sqlite';

const sequelize = new Sequelize({
  dialect: dialect,
  // Solo para SQLite (desarrollo)
  storage: dialect === 'sqlite' ? (process.env.DB_STORAGE || './database.sqlite') : undefined,
  // Para PostgreSQL (producción)
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  models: [User, Survey, Question, SurveyResponse, Answer],
  logging: false,
  // SSL para PostgreSQL en producción (requerido por Render)
  dialectOptions: dialect === 'postgres' && isProduction ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${dialect}).`);

    // En producción usa 'alter' en lugar de 'sync' para evitar perder datos
    if (isProduction) {
      await sequelize.sync({ alter: true });
      console.log('Models synchronized with alter.');
    } else {
      await sequelize.sync();
      console.log('Models synchronized.');
    }
  } catch (error) {
    console.error('❌ Error database:', error);
    process.exit(1);
  }
};

export default sequelize;
