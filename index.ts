import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testDbConnection } from './src/db/mysql'; // Importa la función para probar la conexión

dotenv.config(); // Carga las variables de entorno al inicio

const app: Application = express();

// Rutas
import userRoutes from './src/routes/users.router';
import eventRoutes from './src/routes/events.router';
import salesRoutes from './src/routes/sales.router';
import catalogRoutes from './src/routes/catalog.router';
import seatsRoutes from './src/routes/seats.router';
import authRoutes from './src/routes/auth.router'; // Si lo vas a usar, descomenta

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Log requests to the console

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Montar las rutas
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/auth', authRoutes); // Descomentar si usas auth

// Manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT: number = Number(process.env.PORT) || 3000;

// Iniciar el servidor solo después de probar la conexión a la base de datos
testDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', error);
  process.exit(1); // Salir si la conexión a la DB falla
});