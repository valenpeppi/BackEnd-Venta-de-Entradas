const express = require('express');
const app = express();
const morgan = require('morgan');
const placesRoutes = require('./src/routes/places.router');
const userRoutes = require('./src/routes/users.router');





app.use(express.json()); // Middleware para parsear JSON
app.use(morgan('dev')); // Middleware para registrar las peticiones HTTP



// Montar las rutas en /api/users
app.use('/api/users', userRoutes);
app.use('/api/places', placesRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
