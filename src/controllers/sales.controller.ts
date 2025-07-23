import { Request, Response } from 'express';
import { db } from '../db/mysql'; // Importa el pool de conexiones

class SalesController {
  public async createSale(req: Request, res: Response): Promise<void> {
    const saleData = req.body;
    try {
      // Ejemplo: Insertar una venta (ajusta tu SQL)
      const [result] = await db.query('INSERT INTO sales SET ?', [saleData]);
      res.status(201).json({ message: 'Venta creada exitosamente', data: result });
    } catch (error: any) {
      console.error('Error al crear la venta:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  public async getSalesByClient(req: Request, res: Response): Promise<void> {
    const { dniClient } = req.params;
    try {
      const [rows] = await db.query('SELECT * FROM sales WHERE dni_client = ?', [dniClient]);
      res.status(200).json(rows);
    } catch (error: any) {
      console.error(`Error al obtener ventas para el cliente ${dniClient}:`, error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SalesController();