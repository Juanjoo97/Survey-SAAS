import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const httpServer = createServer(app);

// Configurar Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://mysurveysaas.web.app',
      'https://mysurveysaas.firebaseapp.com',
      'http://localhost:4200', // Para desarrollo local
    ], methods: ['GET', 'POST'],
    credentials: true
  }
});

// Hacer io accesible en toda la app
app.set('io', io);

// Manejar conexiones de Socket.io
io.on('connection', (socket) => {
  // Cliente se une a una "sala" de encuesta específica
  socket.on('join-survey', (surveyId: number) => {
    socket.join(`survey-${surveyId}`);
  });

  // Cliente sale de una sala
  socket.on('leave-survey', (surveyId: number) => {
    socket.leave(`survey-${surveyId}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
