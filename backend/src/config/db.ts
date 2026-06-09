import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Survey } from '../models/Survey';
import { Question } from '../models/Question';
import { SurveyResponse } from '../models/SurveyResponse';
import { Answer } from '../models/Answer';

dotenv.config();

const dialect = (process.env.DB_DIALECT as any) || 'sqlite';
const models  = [User, Survey, Question, SurveyResponse, Answer];

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      models,
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    })
  : new Sequelize({
      dialect,
      storage: dialect === 'sqlite' ? (process.env.DB_STORAGE || './database.sqlite') : undefined,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host:     process.env.DB_HOST,
      port:     Number(process.env.DB_PORT) || 5432,
      models,
      logging: false,
      dialectOptions: dialect === 'postgres' ? {
        ssl: { require: true, rejectUnauthorized: false }
      } : {}
    });

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected (${process.env.DATABASE_URL ? 'postgres/neon' : dialect}).`);
    await sequelize.sync({ alter: true });
    console.log('Models synchronized.');
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
};

export default sequelize;
