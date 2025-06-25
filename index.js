const express = require('express');
const app = express();
const userRoutes = require('./src/routes/users.router');

app.use(express.json());

// Montar las rutas en /api/users
app.use('/api/users', userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
