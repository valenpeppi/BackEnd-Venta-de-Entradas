const db = require('../db/mysql');

const getAllPlaces= (req, res) => {
  db.query('SELECT * FROM places', (err, results) => {
    if (err) {
      console.error('❌ Error al obtener lugares:', err.message);
      return res.status(500).json({ error: 'Error al obtener lugares' });
    }
    res.json(results);
  });
};

module.exports = {
  getAllPlaces
};
