const db = require('../db/mysql');




// Obtener todos los usuarios
const getAllUsers = (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('❌ Error al obtener usuarios:', err.message);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(results);
  });
};



// Agregar un nuevo usuario
const createUser = (req, res) => {
  const { dni, name, surname, mail, birthDate, password } = req.body;

  if (!dni || !name || !surname || !mail || !birthDate || !password) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const query = 'INSERT INTO users (dni, name, surname, mail, birthDate, password) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [dni, name, surname, mail, birthDate, password];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error al crear usuario:', err.message);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
    res.status(201).json({ message: 'Usuario creado correctamente', dni });
  });
};

module.exports = {
  getAllUsers,
  createUser
};
