import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { testDbConnection } from './src/db/mysql';

// SDK Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const app: Application = express();

// Rutas
import placesRoutes from './src/places/places.router';
import userRoutes from './src/users/users.router';
import eventRoutes from './src/event/events.router';
import salesRoutes from './src/sales/sales.router';
import catalogRoutes from './src/catalog/catalog.router';
import authRoutes from './src/auth/auth.router';
// ⚡ si querés, borrá este import y dejá solo el endpoint abajo
// import paymentsRoutes from './src/payments/mp.routes';

// Archivos estáticos
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montar las rutas
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
// app.use("/api/payments", paymentsRoutes); // -> usar si tenés archivo separado

// Manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT: number = Number(process.env.PORT) || 3000;

// =============================
// MERCADO PAGO CONFIG & RUTA
// =============================
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

app.post("/api/payments/create_preference", async (req: Request, res: Response) => {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: { 
        items: req.body.items.map((item: any) => ({
          id: item.id?.toString(),
          title: item.title,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
          
        })),
        back_urls: {
          success: 'http://localhost:5173/success',
          failure: 'http://localhost:5173/failure',
          pending: 'http://localhost:5173/pending',
        },
        
      }
    });

    console.log("✅ Preferencia creada:", result.id);
    res.json({ id: result.id });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia" });
  }
});

// =============================

testDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('No se pudo iniciar el servidor debido a un error de conexión a la base de datos:', error);
  process.exit(1);
});
