// src/controllers/sales.controller.ts
import { Request, Response } from 'express';
// Se actualiza la importación para usar el pool de conexiones 'db'
import { db } from '../db/mysql';

class SalesController {
  /**
   * Crea una nueva venta en la base de datos.
   */
  public async createSale(req: Request, res: Response): Promise<void> {
    // El cuerpo de la solicitud debe contener 'date' y 'dniClient'
    const { date, dniClient } = req.body;

    // Validamos que los datos necesarios estén presentes
    if (!date || !dniClient) {
      res.status(400).json({ error: 'Faltan datos requeridos (date, dniClient)' });
      return;
    }

    try {
      // Creamos la consulta SQL para insertar una nueva venta.
      // Usamos '?' como marcadores de posición para prevenir inyección SQL.
      const sql = 'INSERT INTO sales (date, dniClient) VALUES (?, ?)';
      
      // Ejecutamos la consulta usando db.query, como en tu ejemplo.
      const [result]: any = await db.query(sql, [date, dniClient]);

      // Enviamos una respuesta exitosa con el ID de la nueva venta
      res.status(201).json({ 
        message: 'Venta creada exitosamente', 
        data: { idSale: result.insertId, ...req.body } 
      });

    } catch (error: any) {
      console.error('Error al crear la venta:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  /**
   * Obtiene todas las ventas de un cliente específico por su DNI.
   */
  public async getSalesByClient(req: Request, res: Response): Promise<void> {
    const { dniClient } = req.params;

    try {
      // Creamos la consulta SQL para seleccionar las ventas.
      const sql = 'SELECT * FROM sales WHERE dniClient = ?';

      // Ejecutamos la consulta usando db.query
      const [rows] = await db.query(sql, [dniClient]);

      // Enviamos los resultados encontrados
      res.status(200).json(rows);

    } catch (error: any) {
      console.error(`Error al obtener ventas para el cliente ${dniClient}:`, error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SalesController();
