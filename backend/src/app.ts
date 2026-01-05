// import express, { Application, Request, Response } from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import helmet from 'helmet';
// import authRoutes from './routes/authRoutes';
// import surveyRoutes from './routes/surveyRoutes';
// import publicSurveyRoutes from './routes/publicSurveyRoutes';

// const app: Application = express();

// // Middlewares
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cors());
// app.use(helmet());
// app.use(morgan('dev'));

// app.use('/api/public/surveys', publicSurveyRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/surveys', surveyRoutes);

// app.get('/', (_req: Request, res: Response) => {
//   res.json({ message: 'Welcome to Encuestas SaaS API' });
// });

// export default app;
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import surveyRoutes from './routes/surveyRoutes';
import publicSurveyRoutes from './routes/publicSurveyRoutes';

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👇 Actualiza CORS aquí
app.use(cors({
  origin: [
    'https://mysurveysaas.web.app',
    'https://mysurveysaas.firebaseapp.com',
    'http://localhost:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(morgan('dev'));

// Rutas
app.use('/api/public/surveys', publicSurveyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Encuestas SaaS API' });
});

export default app;
