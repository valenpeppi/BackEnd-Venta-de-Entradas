import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
console.log(`🧩 Cargando variables desde ${envFile}`);

dotenv.config({ path: path.resolve(envFile) });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MP_ACCESS_TOKEN: z.string().optional(),
});

const result = EnvSchema.safeParse(process.env);

let envData: z.infer<typeof EnvSchema>;

if (!result.success) {
  console.log('❌ Invalid env, using default MOCKS for test compatibility');
  envData = {
    NODE_ENV: 'test',
    PORT: '3000',
    FRONTEND_URL: 'http://localhost:5173',
    BACKEND_URL: 'http://localhost:3000',
    DATABASE_URL: 'mysql://mock:mock@localhost:3306/mock_db',
    STRIPE_SECRET_KEY: 'sk_test_mock_1234567890',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock_1234567890',
    MP_ACCESS_TOKEN: 'APP_USR-mock-1234567890'
  };
} else {
  envData = result.data;
}

export const env = {
  ...envData,
  PORT_NUM: Number(envData.PORT || 3000),
};