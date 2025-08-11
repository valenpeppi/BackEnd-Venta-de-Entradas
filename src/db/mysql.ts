import mysql, { Pool, ConnectionOptions } from 'mysql2/promise'; // Importa 'Pool' y 'ConnectionOptions'
import dotenv from 'dotenv';

dotenv.config(); // Carga las variables de entorno

const dbConfig: ConnectionOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ticketapp',
};

// Crea un pool de conexiones
export const db: Pool = mysql.createPool(dbConfig);

// Función para probar la conexión del pool
export async function testDbConnection(): Promise<void> {
  try {
    const connection = await db.getConnection(); // Obtiene una conexión del pool
    console.log('✅ Conectado a la base de datos MySQL exitosa!');
    connection.release(); // Libera la conexión de vuelta al pool
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    throw error; // Propagar el error para que el servidor no se inicie
  }
}