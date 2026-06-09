import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';

dotenv.config();

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://mysurveysaas.web.app',
      'https://mysurveysaas.firebaseapp.com',
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-survey', (surveyId: number) => {
    if (surveyId) socket.join(`survey-${surveyId}`);
  });

  socket.on('leave-survey', (surveyId: number) => {
    if (surveyId) socket.leave(`survey-${surveyId}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
};

startServer();

export { io };
