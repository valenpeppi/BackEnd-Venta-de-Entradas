const mysql = require('mysql2');
require('dotenv').config();
// Configuración de la conexión a MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'casla', // poné tu contraseña si tenés
  database: 'fasticketsell'
});

connection.connect(err => {
  if (err) {
    console.error('❌ Error al conectar con MySQL:', err);
    return;
  }
  console.log('✅ Conexión a MySQL exitosa');
});

module.exports = connection;
