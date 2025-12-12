import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { testDbConnection } from './src/db/mysql';
import { env } from './src/config/env';

dotenv.config();

const app: Application = express();


import placesRoutes from './src/places/places.router';
import eventRoutes from './src/events/events.router';
import salesRoutes from './src/sales/sales.router';
import authRoutes from './src/auth/auth.router';
import stripeRoutes from './src/payments/stripe.routes';
import stripeWebhookRouter from './src/payments/stripe.webhook';
import seatsRoutes from './src/seats/seats.router';
import aiRoutes from "./src/ai/ai.controller";
import systemRoutes from './src/system/system.router';
import messagesRoutes from './src/messages/messages.router';
import { validateToken } from './src/security/jwtValidator';

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

app.use(morgan('dev'));

app.use('/api/stripe/webhook', stripeWebhookRouter);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(validateToken);

app.use('/api/system', systemRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/seats', seatsRoutes);
app.use("/api/ai", aiRoutes);
app.use('/api/messages', messagesRoutes);

import { errorHandler } from './src/middlewares/error.middleware';
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
  const PORT: number = env.PORT_NUM;

  testDbConnection().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT} 🚀`);
      console.log(`Webhook Stripe: POST http://localhost:${PORT}/api/stripe/webhook`);
    });
  }).catch((error) => {
    console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', error);
    process.exit(1);
  });
}

export default app;