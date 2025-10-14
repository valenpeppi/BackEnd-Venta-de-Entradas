import { PrismaClient } from '@prisma/client';
import { env } from '../config/env'; 

export const prisma = new PrismaClient({
  datasources: {
    db: { url: env.DATABASE_URL },
  },
});


export async function testDbConnection(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos MySQL con Prisma!');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos con Prisma:', error);
    throw error;
  }
}