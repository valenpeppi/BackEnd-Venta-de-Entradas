const { pool } = require('../db/mysql');
// Catalog Controller for handling catalog-related requests
const CatalogController = {
  // Event Types
  getEventTypes: async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM eventtype');
    res.json(rows);
  },

  // Places
  getPlaces: async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM places');
    res.json(rows);
  },

  // Sectors by Place
  getSectorsByPlace: async (req, res) => {
    const { idPlace } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM sectors WHERE idPlace = ?', 
      [idPlace]
    );
    res.json(rows);
  }
};

module.exports = CatalogController;