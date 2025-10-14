import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { testDbConnection } from './src/db/mysql';

dotenv.config();

const app: Application = express();

// Importar rutas
import placesRoutes from './src/places/places.router';
import userRoutes from './src/users/users.router';
import eventRoutes from './src/events/events.router';
import salesRoutes from './src/sales/sales.router';
import authRoutes from './src/auth/auth.router';
import stripeRoutes from './src/payments/stripe.routes';
import stripeWebhookRouter from './src/payments/stripe.webhook';
import mpRoutes from './src/payments/mp.routes';
import mpWebhookRouter from './src/payments/mp.webhook';
import seatsRoutes from './src/seats/seats.router';
import aiRoutes from "./src/ai/ai.controller";
import systemRoutes from './src/system/system.router';

// Archivos estáticos
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Logs
app.use(morgan('dev'));

// ⚠️ Webhooks (raw antes de json)
app.use('/api/stripe/webhook', stripeWebhookRouter);
app.use('/api/mp/webhook', mpWebhookRouter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/system', systemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/mp', mpRoutes);
app.use('/api/seats', seatsRoutes);
app.use("/api/ai", aiRoutes);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start
const PORT: number = Number(process.env.PORT) || 3000;

testDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT} 🚀`);
    console.log(`➡️ Webhook Stripe: POST http://localhost:${PORT}/api/stripe/webhook`);
  });
}).catch((error) => {
  console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', error);
  process.exit(1);
});
