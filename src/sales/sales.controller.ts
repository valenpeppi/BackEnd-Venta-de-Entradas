import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SalesController {
  public async confirmSale(req: Request, res: Response): Promise<void> {
    const { dniClient, tickets } = req.body;

    if (dniClient === null || dniClient === undefined || !Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ error: 'Faltan datos requeridos (dniClient, tickets[])' });
      return;
    }

    try {
      // Crear la venta principal
      console.log("🧾 Creando venta con dniClient:", dniClient);
      const sale = await prisma.sale.create({
        data: {
          date: new Date(),
          dniClient,
        },
      });

      // Para cada grupo de tickets (mismo evento + sector)
      for (const ticketGroup of tickets) {
        const { ids, idEvent, idPlace, idSector } = ticketGroup;

        if (!Array.isArray(ids) || ids.length === 0) {
          continue;
        }

        // Verificar disponibilidad
        const available = await prisma.ticket.findMany({
          where: {
            idTicket: { in: ids },
            idEvent,
            idPlace,
            idSector,
            state: 'reserved', // o 'available', según el flujo
          },
        });

        if (available.length !== ids.length) {
          throw new Error('Algunos tickets no están disponibles para la venta');
        }

        // Crear un SaleItem para este grupo
        await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            dateSaleItem: new Date(),
            quantity: ids.length,
          },
        });

        // Actualizar los tickets como vendidos
        await prisma.ticket.updateMany({
          where: {
            idTicket: { in: ids },
            idEvent,
            idPlace,
            idSector,
          },
          data: {
            state: 'sold',
            idSale: sale.idSale,
            dateSaleItem: new Date(),
          },
        });
      }

      res.status(201).json({ message: 'Venta confirmada', idSale: sale.idSale });
    } catch (error: any) {
      console.error('Error al confirmar venta:', error);
      res.status(500).json({ error: 'Error al registrar venta', details: error.message });
    }
  }
}

export default new SalesController();
