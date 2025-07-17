const { pool } = require('../db/mysql');


  // Crear un nuevo evento
  const createEvent = async (req, res, next) => {
    try {
      const { name, description, date, state, idEventType, dniOrganiser } = req.body;
      
      const [result] = await pool.query(
        'INSERT INTO event (name, description, date, state, idEventType, dniOrganiser) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, date, state, idEventType, dniOrganiser]
      );
      
      res.status(201).json({
        idEvent: result.insertId,
        message: 'Evento creado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los eventos
  const getAllEvents = async (req, res, next) => {
    try {
      const [events] = await pool.query(`
        SELECT e.*, et.name as eventType, u.name as organizerName 
        FROM event e
        JOIN eventtype et ON e.idEventType = et.idType
        JOIN users u ON e.dniOrganiser = u.dni
      `);
      
      res.json(events);
    } catch (error) {
      next(error);
    }
  };

  

module.exports = {
  createEvent,
  getAllEvents
};
