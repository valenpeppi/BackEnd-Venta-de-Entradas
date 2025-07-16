require('dotenv').config();
const mysql = require('mysql2');

// Verificar que las variables de entorno están definidas
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('❌ Faltan variables de entorno necesarias');
  process.exit(1);
}

// Crear conexión
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Probar conexión
connection.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar con MySQL:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;
