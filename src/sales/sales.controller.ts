import { Response } from 'express';
import { prisma } from '../db/mysql';
import type { AuthRequest } from '../auth/auth.middleware';

class SalesController {
  public async confirmSale(req: AuthRequest, res: Response): Promise<void> {
    const { dniClient, tickets } = req.body;

    if (dniClient === null || dniClient === undefined || !Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ error: 'Faltan datos requeridos (dniClient, tickets[])' });
      return;
    }

    try {
      // Verificar que el usuario existe
      console.log("🔍 Buscando usuario con dni:", dniClient);
      const user = await prisma.user.findUnique({
        where: { dni: dniClient }
      });

      if (!user) {
        console.error("❌ Usuario no encontrado:", dniClient);
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

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
        console.log("🎫 Procesando grupo de tickets:", ticketGroup);

        if (!Array.isArray(ids) || ids.length === 0) {
          continue;
        }
        
        const saleItemDate = new Date();
        saleItemDate.setMilliseconds(0);

        // Crear un SaleItem para este grupo
        const saleItem = await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            dateSaleItem: saleItemDate,
            quantity: ids.length,
          },
        });
        console.log("📝 SaleItem creado:", saleItem);

        // Si es sector 0 (entrada general), no hay asientos específicos
        if (idSector === 0) {
          console.log(`🎫 Creando tickets de entrada general para evento ${idEvent}`);
          for (let i = 0; i < ids.length; i++) {
            const ticketId = await prisma.ticket.count({ where: { idEvent, idPlace, idSector }}) + i + 1;
            await prisma.ticket.create({
              data: {
                idEvent,
                idPlace,
                idSector: 0,
                idTicket: ticketId,
                state: 'sold',
                idSeat: 0, 
                idSale: sale.idSale,
                dateSaleItem: saleItemDate,
              },
            });
          }
        } else {
          // Para sectores enumerados, verificar y actualizar asientos específicos
          const available = await prisma.seatEvent.findMany({
            where: {
              idSeat: { in: ids },
              idEvent,
              idPlace,
              idSector,
              state: 'reserved', 
            },
          });
          console.log(`📊 Asientos reservados encontrados: ${available.length} de ${ids.length}`);

          if (available.length !== ids.length) {
             const trulyAvailable = await prisma.seatEvent.count({
                where: { idSeat: { in: ids }, idEvent, idPlace, idSector, state: 'available' }
             });
             if (trulyAvailable !== ids.length) {
                throw new Error('Algunos asientos ya no están disponibles para la venta');
             }
          }

          await prisma.seatEvent.updateMany({
            where: {
              idSeat: { in: ids },
              idEvent,
              idPlace,
              idSector,
            },
            data: {
              state: 'sold',
            },
          });
          // Actualizar los tickets ya existentes para cada asiento
          for (const seatId of ids) {
            await prisma.ticket.update({
              where: {
                ticket_by_seat: {
                  idEvent,
                  idPlace,
                  idSector,
                  idSeat: seatId,
                },
              },
              data: {
                state: 'sold',
                idSale: sale.idSale,
                dateSaleItem: saleItemDate,
              },
            });
          }


        }
      }
      console.log("✅ Venta confirmada exitosamente:", sale);
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
      }));

      res.status(200).json({ data: formattedTickets });
    } catch (error: any) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SalesController();

