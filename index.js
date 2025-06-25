// Importar Express
const express = require('express');
const app = express();
require('dotenv').config();

// Puerto donde va a correr el servidor
const PORT = 3000;
console.log('DB desde .env:', process.env.DB_NAME);

// Middleware para poder leer JSON en los requests
app.use(express.json());

// Ruta principal (ejemplo)
app.get('/', (req, res) => {
  res.send('🎟️ Bienvenido a FastTicketSell API');
});

// Ruta ejemplo para obtener usuarios
app.get('/users', (req, res) => {
  // Usuarios de prueba (más adelante los traerías de la DB)
  const users = [
    { dni: 12345678, name: 'Juan' },
    { dni: 87654321, name: 'Lucía' }
  ];
  res.json(users);
});

// Ruta POST de ejemplo
app.post('/users', (req, res) => {
  const newUser = req.body;
  console.log('📥 Usuario recibido:', newUser);
  res.status(201).json({ message: 'Usuario creado', user: newUser });
});

// Arranca el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
