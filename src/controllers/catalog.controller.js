const db = require('../db/mysql');
// Catalog Controller for handling catalog-related requests= {
  // Event Types
 
 
  const getEventTypes = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM eventtype');
    res.json(rows);
  }

  // Places
  const getPlaces = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM places');
    res.json(rows);
  }

  // Sectors by Place
  const getSectorsByPlace = async (req, res) => {
    const { idPlace } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM sectors WHERE idPlace = ?', 
      [idPlace]
    );
    res.json(rows);
  }


module.exports = {
  getEventTypes,
  getPlaces,
  getSectorsByPlace
};