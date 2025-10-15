import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// 🧩 Determina qué archivo .env cargar según el entorno
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
console.log(`🧩 Cargando variables desde ${envFile}`);



// Carga del archivo correcto (.env o .env.test)
dotenv.config({ path: path.resolve(envFile) });



// Esquema de validación de variables
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),
  STRIPE_SECRET_KEY: z.string().optional(), // opcional para entorno local
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MP_ACCESS_TOKEN: z.string().optional(),
});



// Validación de las variables cargadas
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Error validando variables de entorno:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}



// Exportación de variables normalizadas
export const env = {
  ...parsed.data,
  PORT_NUM: Number(parsed.data.PORT || 3000),
};
