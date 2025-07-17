require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // ssl: { rejectUnauthorized: false } // Descomentar si se requiere SSL
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar con MySQL:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;
