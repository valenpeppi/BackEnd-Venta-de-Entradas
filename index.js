const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
const userRoutes = require('./src/routes/users.router');
const eventRoutes = require('./src/routes/events.router');
const salesRoutes = require('./src/routes/sales.router');
const catalogRoutes= require('./src/routes/catalog.router');
const seatsRoutes = require('./src/routes/seats.router');
//const authRoutes = require('./src/routes/auth.router');


// Middleware
app.use(express.json());   // Parse JSON bodies
app.use(cors());           // Enable CORS
app.use(morgan('dev'));   // Log requests to the console

// Montar las rutas en /api/users
app.use('/api/users', userRoutes);
// Montar las rutas en /api/events
app.use('/api/events', eventRoutes);
// Montar las rutas en /api/sales
app.use('/api/sales', salesRoutes);
// Montar las rutas en /api/catalog 
app.use('/api/catalog', catalogRoutes); 
// Montar las rutas en /api/seats
app.use('/api/seats', seatsRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Configuración de CORS
// Permitir solicitudes desde el frontend

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173/',
  credentials: true
}));