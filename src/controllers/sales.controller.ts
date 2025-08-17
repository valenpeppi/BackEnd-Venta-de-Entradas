// src/controllers/sales.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SalesController {
  /**
   * Crea una nueva venta en la base de datos usando Prisma.
   */
  public async createSale(req: Request, res: Response): Promise<void> {
    const { date, dniClient } = req.body;

    if (!date || !dniClient) {
      res.status(400).json({ error: 'Faltan datos requeridos (date, dniClient)' });
      return;
    }

    try {
      const sale = await prisma.sales.create({
        data: {
          date: new Date(date),
          dniClient: dniClient
        }
      });

      res.status(201).json({
        message: 'Venta creada exitosamente',
        data: { idSale: sale.idSale, ...req.body }
      });

    } catch (error: any) {
      console.error('Error al crear la venta:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  /**
   * Obtiene todas las ventas de un cliente específico por su DNI usando Prisma.
   */
  public async getSalesByClient(req: Request, res: Response): Promise<void> {
    const { dniClient } = req.params;

    try {
      const sales = await prisma.sales.findMany({
        where: { dniClient: dniClient }
      });

      res.status(200).json(sales);

    } catch (error: any) {
      console.error(`Error al obtener ventas para el cliente ${dniClient}:`, error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SalesController();
