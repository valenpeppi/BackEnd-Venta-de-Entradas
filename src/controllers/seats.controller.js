const { db } = require('../db/mysql');

const SeatsController = {
  // Consultar disponibilidad
  getAvailableSeats: async (req, res, next) => {
    try {
      const { idEvent, idPlace, idSector } = req.query;

      const [seats] = await db.query(`
        SELECT s.idSeat, s.state, p.price
        FROM seats s
        LEFT JOIN (
          SELECT idEvent, idPlace, idSector, price 
          FROM prices 
          WHERE idEvent = ? AND dateSince <= NOW()
          ORDER BY dateSince DESC LIMIT 1
        ) p ON s.idPlace = p.idPlace AND s.idSector = p.idSector
        WHERE s.idPlace = ? 
        AND s.idSector = ?
        AND s.state = 'D'
      `, [idEvent, idPlace, idSector]);

      res.json(seats);
    } catch (error) {
      next(error);
    }
  },

  // Actualizar estado de asiento (admin)
  updateSeatState: async (req, res, next) => {
    try {
      const { idPlace, idSector, idSeat } = req.params;
      const { state } = req.body;

      await pool.query(
        'UPDATE seats SET state = ? WHERE idSeat = ? AND idSector = ? AND idPlace = ?',
        [state, idSeat, idSector, idPlace]
      );

      res.json({ message: 'Estado actualizado' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SeatsController;