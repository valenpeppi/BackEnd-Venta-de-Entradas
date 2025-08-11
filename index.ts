import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testDbConnection } from './src/db/mysql';
import path from 'path';
dotenv.config();

const app: Application = express();

// Rutas
import userRoutes from './src/routes/users.router';
import eventRoutes from './src/routes/events.router';
import salesRoutes from './src/routes/sales.router';
import catalogRoutes from './src/routes/catalog.router';
import seatsRoutes from './src/routes/seats.router';
import authRoutes from './src/routes/auth.router';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));

// Configuración correcta para parsear JSON y datos de formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la carpeta "uploads"
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Montar las rutas
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/auth', authRoutes);

// Manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT: number = Number(process.env.PORT) || 3000;

testDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', error);
  process.exit(1);
});
