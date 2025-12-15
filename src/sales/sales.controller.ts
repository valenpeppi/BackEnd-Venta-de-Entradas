import { Response } from 'express';
import { prisma } from '../db/mysql';
import type { AuthRequest } from '../auth/auth.middleware';
import { env } from '../config/env';
import { sendMail } from '../services/mailer.service';
import { getPurchaseConfirmationTemplate } from '../services/email.templates';

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

      const eventQtyMap = new Map<string, number>();
      const requestedSeatsByEvent = new Map<string, { idPlace: string; idSector: number; ids: number[] }[]>();

      for (const group of tickets) {
        const idEvent = String(group.idEvent);
        const idPlace = String(group.idPlace);
        const idSector = Number(group.idSector);
        const ids: number[] = Array.isArray(group.ids) ? group.ids.map(Number) : [];

        if (!idEvent || !idPlace || !idSector || ids.length === 0) {
          res.status(400).json({ error: 'Grupo inválido: faltan datos o ids' });
          return;
        }

        eventQtyMap.set(idEvent, (eventQtyMap.get(idEvent) || 0) + ids.length);
        const arr = requestedSeatsByEvent.get(idEvent) || [];
        arr.push({ idPlace, idSector, ids });
        requestedSeatsByEvent.set(idEvent, arr);
      }

      const userSales = await prisma.sale.findMany({
        where: { client: { dni: dniClient } },
        select: { idSale: true },
      });
      const saleIds = userSales.map(s => s.idSale);

      for (const [idEvent, reqQty] of eventQtyMap.entries()) {
        const alreadyBought = await prisma.ticket.count({
          where: {
            idSale: { in: saleIds.length ? saleIds : ['00000000-0000-0000-0000-000000000000'] },
            idEvent,
            state: 'sold',
          },
        });

        if (alreadyBought + reqQty > 6) {
          res.status(400).json({
            error: `Límite superado: ya tenés ${alreadyBought} para evento ${idEvent} y solicitaste ${reqQty}. Máximo 6.`,
          });
          return;
        }
      }

      const allTicketKeys = tickets.flatMap((group: any) =>
        (group.ids || []).map((idSeat: number) => ({
          idEvent: String(group.idEvent),
          idPlace: String(group.idPlace),
          idSector: Number(group.idSector),
          idSeat: Number(idSeat),
        }))
      );

      if (allTicketKeys.length === 0) {
        res.status(400).json({ error: 'No hay asientos (ids) para confirmar' });
        return;
      }

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
        console.log('ℹ️ Tickets duplicados encontrados');
        res.status(200).json({ message: 'Venta ya registrada previamente.' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            date: new Date(),
            client: { connect: { dni: dniClient } },
          },
        });



        let lineNumber = 1;

        for (const group of tickets) {
          const idEvent = String(group.idEvent);
          const idPlace = String(group.idPlace);
          const idSector = Number(group.idSector);
          const ids: number[] = Array.isArray(group.ids) ? group.ids.map(Number) : [];
          if (!ids.length) continue;



          await tx.saleItem.create({
            data: {
              idSale: sale.idSale,
              lineNumber,
              quantity: ids.length,
            },
          });

          const reservedSeats = await tx.seatEvent.findMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'reserved' },
          });
          if (reservedSeats.length !== ids.length) {
            throw new Error('Algunos asientos ya no están reservados o disponibles');
          }

          await tx.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: ids } },
            data: { state: 'sold', idSale: sale.idSale, lineNumber },
          });

          for (const idSeat of ids) {
            const existing = await tx.ticket.findUnique({
              where: {
                ticket_by_seat: { idEvent, idPlace, idSector, idSeat },
              },
            });

            if (existing) {
              await tx.ticket.update({
                where: {
                  ticket_by_seat: { idEvent, idPlace, idSector, idSeat },
                },
                data: { state: 'sold', idSale: sale.idSale, lineNumber },
              });

            } else {
              const newTicketId = (await tx.ticket.count({
                where: { idEvent, idPlace, idSector },
              })) + 1;

              await tx.ticket.create({
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

            }
          }

          lineNumber++;
        }

        return sale.idSale;
      });


      try {

        const boughtTickets = await prisma.ticket.findMany({
          where: { idSale: result, state: 'sold' },
          include: {
            event: { include: { place: true } },
            eventSector: { include: { sector: true } }
          }
        });

        if (user.mail) {
          await sendMail({
            to: user.mail,
            subject: '¡Confirmación de Compra - TicketApp!',
            html: getPurchaseConfirmationTemplate(user.name, boughtTickets)
          });
        }

      } catch (emailError) {
      }

      res.status(201).json({ message: 'Venta confirmada', idSale: result });
    } catch (error: any) {
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
        where: { client: { dni: dniClient } },
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
        sectorType: ticket.eventSector.sector.sectorType as 'enumerated' | 'nonEnumerated' | string,
        seatNumber: ticket.idSeat,
        imageUrl: ticket.event.image
          ? `${env.BACKEND_URL}${ticket.event.image}`
          : '/ticket.png',
        idTicket: ticket.idTicket,
        idSale: ticket.idSale,
      }));

      res.status(200).json({ data: formattedTickets });
    } catch (error: any) {

      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  public async getAdminStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);


      const salesToday = await prisma.sale.count({
        where: { date: { gte: todayStart } },
      });


      const ticketsToday = await prisma.ticket.count({
        where: {
          saleItem: {
            sale: { date: { gte: todayStart } }
          },
          state: 'sold'
        }
      });


      const soldTicketsToday = await prisma.ticket.findMany({
        where: {
          saleItem: {
            sale: { date: { gte: todayStart } }
          },
          state: 'sold'
        },
        include: {
          eventSector: {
            select: { price: true }
          }
        }
      });

      const revenueToday = soldTicketsToday.reduce((sum, t) => sum + Number(t.eventSector.price), 0);


      const pendingEvents = await prisma.event.count({
        where: { state: 'Pending' }
      });

      res.status(200).json({
        salesToday,
        ticketsToday,
        revenueToday,
        pendingEvents
      });

    } catch (error: any) {

      res.status(500).json({ error: 'Error obteniendo estadísticas', details: error.message });
    }
  }

  public async getCompanyStats(req: AuthRequest, res: Response): Promise<void> {
    const idOrganiser = req.auth?.idOrganiser;

    if (!idOrganiser) {
      res.status(403).json({ error: 'Acceso denegado: Se requiere ser una empresa registrada.' });
      return;
    }

    try {




      const activeEventsCount = await prisma.event.count({
        where: {
          idOrganiser,
          state: { in: ['Approved', 'Pending'] }
        }
      });


      const soldTickets = await prisma.ticket.count({
        where: {
          event: { idOrganiser },
          state: 'sold'
        }
      });



      const soldTicketsData = await prisma.ticket.findMany({
        where: {
          event: { idOrganiser },
          state: 'sold'
        },
        include: {
          eventSector: { select: { price: true } }
        }
      });

      const totalRevenue = soldTicketsData.reduce((sum, t) => sum + Number(t.eventSector.price), 0);



      res.json({
        activeEvents: activeEventsCount,
        ticketsSold: soldTickets,
        totalRevenue
      });

    } catch (error: any) {
      res.status(500).json({ error: 'Error obteniendo estadísticas de empresa', details: error.message });
    }
  }

}

export default new SalesController();
