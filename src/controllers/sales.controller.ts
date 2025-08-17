// src/controllers/sales.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SalesController {
  public async createSale(req: Request, res: Response): Promise<void> {
    const { date, dniClient } = req.body;

    if (!date || !dniClient) {
      res.status(400).json({ error: 'Faltan datos requeridos (date, dniClient)' });
      return;
    }

    try {
        const sale = await prisma.sale.create({
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

  public async getSalesByClient(req: Request, res: Response): Promise<void> {
    const { dniClient } = req.params;

    try {
      const sales = await prisma.sale.findMany({
        where: { dniClient: Number(dniClient) }
      });

      res.status(200).json(sales);

    } catch (error: any) {
      console.error(`Error al obtener ventas para el cliente ${dniClient}:`, error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SalesController();