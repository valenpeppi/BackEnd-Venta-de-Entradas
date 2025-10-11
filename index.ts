import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { testDbConnection, prisma } from './src/db/mysql';
import { env } from './src/config/env';

dotenv.config();

const app: Application = express();

// Rutas
import placesRoutes from './src/places/places.router';
import userRoutes from './src/users/users.router';
import eventRoutes from './src/events/events.router';
import salesRoutes from './src/sales/sales.router';
import catalogRoutes from './src/catalog/catalog.router';
import authRoutes from './src/auth/auth.router';
import stripeRoutes from './src/payments/stripe.routes';
import stripeWebhookRouter from './src/payments/stripe.webhook';
import mpRoutes from './src/payments/mp.routes';
import mpWebhookRouter from './src/payments/mp.webhook';
import seatsRoutes from './src/seats/seats.router';
import aiRoutes from './src/ai/ai.controller';

// Webhooks
app.use('/api/stripe/webhook', stripeWebhookRouter);
app.use('/api/mp/webhook', mpWebhookRouter);

// Estáticos
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Seguridad y rendimiento
app.use(helmet());
app.use(compression());

// CORS
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Logger
morgan.token('id', () => Math.random().toString(36).slice(2, 8));
app.use(morgan(':id :method :url :status :response-time ms - :res[content-length]'));

// Parsers (después de webhooks)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/mp', mpRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/ai', aiRoutes);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start
const PORT = env.PORT_NUM;
let server: any;

testDbConnection()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT} 🚀`);
      console.log(`➡️ Webhook Stripe: POST http://localhost:${PORT}/api/stripe/webhook`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el servidor (DB):', error);
    process.exit(1);
  });

const shutdown = async () => {
  console.log('🛑 Cerrando servidor...');
  server?.close(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
