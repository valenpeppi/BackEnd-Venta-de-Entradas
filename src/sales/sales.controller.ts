import { Response } from 'express';
import { prisma } from '../db/mysql';
import type { AuthRequest } from '../auth/auth.middleware';

class SalesController {
  public async confirmSale(req: AuthRequest, res: Response): Promise<void> {
    const { dniClient, tickets } = req.body;

    if (!dniClient || !Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ error: 'Faltan datos requeridos (dniClient, tickets[])' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { dni: dniClient } });

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Crear venta
      const sale = await prisma.sale.create({
        data: { date: new Date(), dniClient },
      });

      let lineNumber = 1;

      for (const group of tickets) {
        const { ids, idEvent, idPlace, idSector } = group;

        if (!Array.isArray(ids) || ids.length === 0) continue;

        // Crear línea de venta
        await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            lineNumber,
            quantity: ids.length,
          },
        });

        if (idSector === 0) {
          // Sector NO enumerado (general)
          for (let i = 0; i < ids.length; i++) {
            // Validación extra: evitar crear ticket duplicado
            const exists = await prisma.ticket.findFirst({
              where: {
                idEvent,
                idPlace,
                idSector: 0,
                idSeat: 0,
                idSale: sale.idSale,
                lineNumber,
              },
            });

            if (exists) continue;

            const ticketId = await prisma.ticket.count({
              where: { idEvent, idPlace, idSector: 0 },
            }) + 1;

            await prisma.ticket.create({
              data: {
                idEvent,
                idPlace,
                idSector: 0,
                idTicket: ticketId,
                idSeat: 0,
                state: 'sold',
                idSale: sale.idSale,
                lineNumber,
              },
            });
          }

        } else {
          // Sector ENUMERADO
          const reservedSeats = await prisma.seatEvent.findMany({
            where: {
              idEvent,
              idPlace,
              idSector,
              idSeat: { in: ids },
              state: 'reserved',
            },
          });

          if (reservedSeats.length !== ids.length) {
            throw new Error('Algunos asientos ya no están reservados o no disponibles');
          }

          await prisma.seatEvent.updateMany({
            where: {
              idEvent,
              idPlace,
              idSector,
              idSeat: { in: ids },
            },
            data: {
              state: 'sold',
              idSale: sale.idSale,
              lineNumber,
            },
          });

          for (const idSeat of ids) {
            await prisma.ticket.update({
              where: {
                ticket_by_seat: {
                  idEvent,
                  idPlace,
                  idSector,
                  idSeat,
                },
              },
              data: {
                state: 'sold',
                idSale: sale.idSale,
                lineNumber,
              },
            });
          }
        }

        lineNumber++;
      }

      res.status(201).json({ message: 'Venta confirmada', idSale: sale.idSale });

    } catch (error: any) {
      console.error('Error al confirmar venta:', error);
      res.status(500).json({ error: 'Error al registrar venta', details: error.message });
    }
  }


  public async getUserTickets(req: AuthRequest, res: Response): Promise<void> {
    const dniClient = req.auth?.dni;

    if (!dniClient) {
      res.status(401).json({ error: 'No autorizado o DNI no encontrado en el token.' });
      return;
    }

    try {
      const userSales = await prisma.sale.findMany({
        where: { dniClient },
        select: { idSale: true },
      });

      if (userSales.length === 0) {
        res.status(200).json({ data: [] });
        return;
      }

      const saleIds = userSales.map(s => s.idSale);

      const userTickets = await prisma.ticket.findMany({
        where: {
          idSale: { in: saleIds },
          state: 'sold',
        },
        include: {
          event: {
            include: {
              place: true,
            },
          },
          eventSector: {
            include: {
              sector: true,
            },
          },
        },
        orderBy: {
          event: {
            date: 'asc',
          },
        },
      });
      
      const formattedTickets = userTickets.map(ticket => ({
        id: `${ticket.idEvent}-${ticket.idTicket}`,
        eventId: ticket.idEvent,
        eventName: ticket.event.name,
        date: ticket.event.date.toISOString(),
        time: new Date(ticket.event.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs',
        location: ticket.event.place.name,
        sectorName: ticket.eventSector.sector.name,
        seatNumber: ticket.idSeat,
        imageUrl: ticket.event.image ? `${process.env.BACKEND_URL || 'http://localhost:3000'}${ticket.event.image}` : '/ticket.png',
        idTicket: ticket.idTicket,
        idSale: ticket.idSale, 
      }));

      res.status(200).json({ data: formattedTickets });
    } catch (error: any) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SalesController();

