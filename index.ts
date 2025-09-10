import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testDbConnection } from './src/db/mysql';
import path from 'path';
dotenv.config();
// SDK de Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';


const app: Application = express();

// Rutas
import placesRoutes from './src/places/places.router';
import userRoutes from './src/users/users.router';
import eventRoutes from './src/event/events.router';
import salesRoutes from './src/sales/sales.router';
import catalogRoutes from './src/catalog/catalog.router';

import authRoutes from './src/auth/auth.router';
import paymentsRoutes from './src/payments/mp.routes';
import { title } from 'process';

import { fileURLToPath } from 'url';

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));

// Configuración correcta para parsear JSON y datos de formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Montar las rutas
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use("/api/payments", paymentsRoutes);


app.use(express.json({ type: "*/*" }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));


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

// Agrega credenciales
const client = new MercadoPagoConfig({ accessToken: 'APP_USR-3312580635175308-090415-dd54815b21ddfbfbc3d626eac20feb91-2662356501' });

app.post("/create_preference", async (req: Request, res: Response) => {
  try {
  const body = { 
      items: [
        {
          id: req.body.id,
          title: req.body.title,
          unit_price: Number(req.body.unit_price),
          quantity: Number(req.body.quantity)
       },
      ],
  back_urls: {
    success: 'http://localhost:5173/success',
    failure: 'http://localhost:5173/failure',
    pending: 'http://localhost:5173/pending',
    },
    auto_return: 'approved',
  };

  const preference = new Preference(client);
  const result = await preference.create({ body });
  res.json({ 
    id: result.id
  });
  } catch (error) {
    console.log(error);
  }
});