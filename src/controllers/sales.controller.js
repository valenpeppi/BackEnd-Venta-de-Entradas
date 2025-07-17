const { db } = require('../config/db');

const SalesController = {
  // Crear una nueva venta
  createSale: async (req, res, next) => {
    try {
      const { dniClient, items } = req.body; // items = [{idEvent, idPlace, idSector, idSeat, price}]
      
      // 1. Validar cliente
      const [user] = await db.query('SELECT dni FROM users WHERE dni = ?', [dniClient]);
      if (!user.length) return res.status(404).json({ error: 'Cliente no encontrado' });

      // 2. Iniciar transacción
      const conn = await db.getConnection();
      await conn.beginTransaction();

      try {
        // 3. Crear venta principal
        const [saleResult] = await conn.query(
          'INSERT INTO sales (date, dniClient) VALUES (NOW(), ?)',
          [dniClient]
        );
        const idSale = saleResult.insertId;

        // 4. Procesar items
        for (const item of items) {
          // Validar disponibilidad
          const [seat] = await conn.query(
            'SELECT state FROM seats WHERE idSeat = ? AND idSector = ? AND idPlace = ? FOR UPDATE',
            [item.idSeat, item.idSector, item.idPlace]
          );
          
          if (!seat.length || seat[0].state !== 'D') {
            throw new Error(`Asiento ${item.idSeat} no disponible`);
          }

          // Crear saleitem
          await conn.query(
            'INSERT INTO saleitem (idSale, dateSaleItem, quantity) VALUES (?, NOW(), 1)',
            [idSale]
          );

          // Crear ticket
          await conn.query(
            `INSERT INTO ticket 
            (idEvent, idPlace, idSector, idTicket, state, idSeat, dateSaleItem, idSale) 
            VALUES (?, ?, ?, ?, 'V', ?, NOW(), ?)`,
            [item.idEvent, item.idPlace, item.idSector, uuidv4(), item.idSeat, idSale]
          );

          // Actualizar asiento
          await conn.query(
            'UPDATE seats SET state = "O" WHERE idSeat = ? AND idSector = ? AND idPlace = ?',
            [item.idSeat, item.idSector, item.idPlace]
          );
        }

        await conn.commit();
        res.status(201).json({ idSale, message: 'Venta completada' });
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      next(error);
    }
  },

  // Obtener historial de ventas
  getSalesByClient: async (req, res, next) => {
    try {
      const { dniClient } = req.params;
      
      const [sales] = await pool.query(`
        SELECT s.idSale, s.date, 
               JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'event', e.name,
                   'place', p.name,
                   'sector', sec.name,
                   'seat', t.idSeat
                 )
               ) AS tickets
        FROM sales s
        JOIN ticket t ON s.idSale = t.idSale
        JOIN event e ON t.idEvent = e.idEvent
        JOIN places p ON t.idPlace = p.idPlace
        JOIN sectors sec ON t.idSector = sec.idSector AND t.idPlace = sec.idPlace
        WHERE s.dniClient = ?
        GROUP BY s.idSale
      `, [dniClient]);

      res.json(sales);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SalesController;