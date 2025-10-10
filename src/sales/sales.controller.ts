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

      // Evitar duplicados
      const allTicketKeys = tickets.flatMap(group =>
        group.ids.map((id: number) => ({
          idEvent: group.idEvent,
          idPlace: group.idPlace,
          idSector: group.idSector,
          idSeat: group.idSector === 0 ? 0 : id,
        }))
      );

      const duplicates = await prisma.ticket.findMany({
        where: {
          OR: allTicketKeys.map(k => ({
            idEvent: k.idEvent,
            idPlace: k.idPlace,
            idSector: k.idSector,
            idSeat: k.idSeat,
            state: 'sold',
          })),
        },
      });

      if (duplicates.length > 0) {
        console.warn('⚠️ Venta duplicada detectada, se cancela registro.');
        res.status(200).json({ message: 'Venta ya registrada previamente.' });
        return;
      }

      // Crear venta
      const sale = await prisma.sale.create({
        data: { date: new Date(), dniClient },
      });

      console.log(`🧾 Venta creada: #${sale.idSale} para DNI ${dniClient}`);

      let lineNumber = 1;

      for (const group of tickets) {
        const { ids, idEvent, idPlace, idSector } = group;

        if (!Array.isArray(ids) || ids.length === 0) continue;

        console.log(`🎟️ Procesando grupo: evento ${idEvent}, sector ${idSector}, asientos:`, ids);

        await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            lineNumber,
            quantity: ids.length,
          },
        });

        if (idSector === 0) {
          // SECTOR NO ENUMERADO (entradas generales)
          console.log(`💺 Marcando ${ids.length} entradas generales como vendidas...`);

          // Buscar las primeras disponibles (ordenadas por idTicket asc)
          const availableTickets = await prisma.ticket.findMany({
            where: {
              idEvent,
              idPlace,
              idSector: 0,
              state: 'available',
            },
            orderBy: { idTicket: 'asc' },
            take: ids.length,
          });

          if (availableTickets.length < ids.length) {
            throw new Error('No hay suficientes tickets disponibles para este evento.');
          }

          // Actualizarlas a "sold"
          for (const ticket of availableTickets) {
            await prisma.ticket.update({
              where: {
                ticket_by_seat: {
                  idEvent,
                  idPlace,
                  idSector: 0,
                  idSeat: 0,
                },
              },
              data: {
                state: 'sold',
                idSale: sale.idSale,
                lineNumber,
              },
            });
            console.log(`🟢 Ticket #${ticket.idTicket} marcado como vendido.`);
          }

          console.log(`✅ ${availableTickets.length} tickets generales vendidos.`);
        } else {
          // SECTOR ENUMERADO
          console.log(`🔒 Confirmando asientos reservados en seatEvent...`);

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
            throw new Error('Algunos asientos ya no están reservados o disponibles');
          }

          // 🔁 Actualizar seatEvent → vendido
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

          console.log(`✅ Asientos actualizados a 'sold' en seatEvent`);

          // Actualizar o crear ticket correspondiente
          for (const idSeat of ids) {
            const existing = await prisma.ticket.findUnique({
              where: {
                ticket_by_seat: {
                  idEvent,
                  idPlace,
                  idSector,
                  idSeat,
                },
              },
            });

            if (existing) {
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
              console.log(`🟢 Ticket actualizado: asiento ${idSeat}`);
            } else {
              const newTicketId = await prisma.ticket.count({
                where: { idEvent, idPlace, idSector },
              }) + 1;

              await prisma.ticket.create({
                data: {
                  idEvent,
                  idPlace,
                  idSector,
                  idSeat,
                  idTicket: newTicketId,
                  state: 'sold',
                  idSale: sale.idSale,
                  lineNumber,
                },
              });
              console.log(`🆕 Ticket creado para asiento ${idSeat}`);
            }
          }
        }

        lineNumber++;
      }

      res.status(201).json({ message: 'Venta confirmada', idSale: sale.idSale });
    } catch (error: any) {
      console.error('❌ Error al confirmar venta:', error);
      res.status(500).json({ error: 'Error al registrar venta', details: error.message });
    }
  }

  // Obtener tickets del usuario
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
          event: { include: { place: true } },
          eventSector: { include: { sector: true } },
        },
        orderBy: { event: { date: 'asc' } },
      });

      const formattedTickets = userTickets.map(ticket => ({
        id: `${ticket.idEvent}-${ticket.idTicket}`,
        eventId: ticket.idEvent,
        eventName: ticket.event.name,
        date: ticket.event.date.toISOString(),
        time:
          new Date(ticket.event.date).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' hs',
        location: ticket.event.place.name,
        sectorName: ticket.eventSector.sector.name,
        seatNumber: ticket.idSeat,
        imageUrl: ticket.event.image
          ? `${process.env.BACKEND_URL || 'http://localhost:3000'}${ticket.event.image}`
          : '/ticket.png',
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
