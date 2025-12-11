import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

export const prisma = new PrismaClient({
  datasources: {
    db: { url: env.DATABASE_URL },
  },
});

export async function testDbConnection(): Promise<void> {
  try {
    if (env.NODE_ENV === 'test' || env.DATABASE_URL?.includes('mock')) {
      console.log('⚠ Skipping DB connection test (Test/Mock Mode)');
      return;
    }
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos MySQL con Prisma!');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos con Prisma:', error);
    throw error;
  }
}