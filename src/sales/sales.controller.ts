import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SalesController {
  public async confirmSale(req: Request, res: Response): Promise<void> {
    const { dniClient, tickets } = req.body;

    if (!dniClient || !Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ error: 'Faltan datos requeridos (dniClient, tickets[])' });
      return;
    }

    try {
      const sale = await prisma.sale.create({
        data: {
          date: new Date(),
          dniClient,
        },
      });

      for (const ticket of tickets) {
        const { eventId, idPlace, idSector, ids } = ticket;

        const availableSeats = await prisma.seatEvent.findMany({
          where: {
            idEvent: eventId,
            idPlace,
            idSector,
            idSeat: { in: ids },
            state: 'reserved',
          },
        });

        if (availableSeats.length !== ids.length) {
          throw new Error('Algunos asientos ya fueron vendidos');
        }
        await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            dateSaleItem: new Date(),
            quantity: ids.length,
          },
        });
        for (const idSeat of ids) {
          await prisma.seatEvent.update({
            where: {
              idEvent_idPlace_idSector_idSeat: {
                idEvent: eventId,
                idPlace,
                idSector,
                idSeat,
              },
            },
            data: {
              state: 'sold',
            },
          });
        }
        await prisma.ticket.updateMany({
          where: {
            idEvent: eventId,
            idPlace,
            idSector,
            idSeat: { in: ids },
          },
          data: {
            idSale: sale.idSale,
            dateSaleItem: new Date(),
            state: 'sold',
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
