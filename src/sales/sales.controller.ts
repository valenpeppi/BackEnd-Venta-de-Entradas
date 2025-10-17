import { Response } from 'express';
import { prisma } from '../db/mysql';
import type { AuthRequest } from '../auth/auth.middleware';

class SalesController {
  public async confirmSale(req: AuthRequest, res: Response): Promise<void> {
    const { dniClient, tickets } = req.body;

    console.log('🟦 [confirmSale] Inicio — dniClient:', dniClient, '| grupos:', Array.isArray(tickets) ? tickets.length : 0);

    if (!dniClient || !Array.isArray(tickets) || tickets.length === 0) {
      console.warn('🟨 [confirmSale] Faltan datos requeridos (dniClient/tickets)');
      res.status(400).json({ error: 'Faltan datos requeridos (dniClient, tickets[])' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { dni: Number(dniClient) } });
      if (!user) {
        console.warn('🟨 [confirmSale] Usuario no encontrado para DNI:', dniClient);
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // ---- Límite de 6 por evento (acumulado) ----
      const eventQty = new Map<number, number>();
      for (const g of tickets) {
        const idEvent = Number(g.idEvent);
        const idPlace = Number(g.idPlace);
        const idSector = Number(g.idSector);
        const ids: number[] = Array.isArray(g.ids)
          ? (g.ids as (number | string)[])
              .map((v) => Number(v))
              .filter((n: number) => Number.isFinite(n) && n > 0)
          : [];

        console.log('🔎 [confirmSale] Grupo recibido:', { idEvent, idPlace, idSector, idsCount: ids.length });

        if (!idEvent || !idPlace || !idSector || ids.length === 0) {
          console.warn('🟨 [confirmSale] Grupo inválido (faltan ids o ids vacíos)');
          res.status(400).json({ error: 'Grupo inválido: idEvent/idPlace/idSector/ids son obligatorios' });
          return;
        }
        eventQty.set(idEvent, (eventQty.get(idEvent) || 0) + ids.length);
      }

      const prevSales = await prisma.sale.findMany({
        where: { dniClient: Number(dniClient) },
        select: { idSale: true },
      });
      const prevSaleIds = prevSales.map((s) => s.idSale);

      for (const [idEvent, reqQty] of eventQty.entries()) {
        const alreadyBought = await prisma.ticket.count({
          where: {
            idEvent,
            state: 'sold',
            idSale: { in: prevSaleIds.length ? prevSaleIds : [-1] },
          },
        });
        console.log('🧮 [confirmSale] Control límite — evento:', idEvent, '| ya tiene:', alreadyBought, '| pide:', reqQty);
        if (alreadyBought + reqQty > 6) {
          console.warn('🟥 [confirmSale] Límite superado para evento', idEvent);
          res.status(400).json({
            error: `Límite superado: ya tenés ${alreadyBought} para el evento ${idEvent} y pediste ${reqQty}. Máximo 6.`,
          });
          return;
        }
      }

      // ---- Idempotencia: si alguno ya está "sold", no duplicamos ----
      const allKeys = tickets.flatMap((g: any) =>
        (g.ids || []).map((idSeat: number | string) => ({
          idEvent: Number(g.idEvent),
          idPlace: Number(g.idPlace),
          idSector: Number(g.idSector),
          idSeat: Number(idSeat),
        })),
      );

      if (allKeys.length === 0) {
        console.warn('🟨 [confirmSale] allKeys vacío — no hay asientos para confirmar');
        res.status(400).json({ error: 'No hay asientos (ids) para confirmar' });
        return;
      }

      const alreadySold = await prisma.ticket.findMany({
        where: {
          OR: allKeys.map((k) => ({
            idEvent: k.idEvent,
            idPlace: k.idPlace,
            idSector: k.idSector,
            idSeat: k.idSeat,
            state: 'sold',
          })),
        },
        select: { idEvent: true, idSeat: true },
      });

      if (alreadySold.length > 0) {
        console.log('ℹ️ [confirmSale] Venta ya confirmada previamente. Tickets sold detectados:', alreadySold.length);
        res.status(200).json({ confirmed: true, message: 'Venta ya confirmada previamente' });
        return;
      }

      // ---- Transacción de confirmación ----
      const idSale = await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: { date: new Date(), dniClient: Number(dniClient) },
        });
        console.log('🧾 [confirmSale] Venta creada', { idSale: sale.idSale, dniClient: Number(dniClient) });

        let lineNumber = 1;
        let totalAsientos = 0;

        for (const group of tickets) {
          const idEvent = Number(group.idEvent);
          const idPlace = Number(group.idPlace);
          const idSector = Number(group.idSector);
          const ids: number[] = Array.isArray(group.ids)
            ? (group.ids as (number | string)[])
                .map((v) => Number(v))
                .filter((n: number) => Number.isFinite(n) && n > 0)
            : [];

          if (!idEvent || !idPlace || !idSector || ids.length === 0) {
            throw new Error('Grupo inválido en confirmación de venta.');
          }

          await tx.saleItem.create({
            data: { idSale: sale.idSale, lineNumber, quantity: ids.length },
          });

          // 1) Aún reservados
          const reservedSeats = await tx.seatEvent.findMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'reserved' },
          });
          if (reservedSeats.length !== ids.length) {
            console.warn('🟥 [confirmSale] Mismatch reservas — esperados:', ids.length, 'reservados:', reservedSeats.length);
            throw new Error('Algunos asientos ya no están reservados o disponibles');
          }

          // 2) seatEvent -> sold (no setteamos idSale por FK)
          await tx.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: ids } },
            data: { state: 'sold', lineNumber },
          });

          // 3) ticket -> sold + link venta
          for (const idSeat of ids) {
            const existing = await tx.ticket.findUnique({
              where: { ticket_by_seat: { idEvent, idPlace, idSector, idSeat } },
            });

            if (existing) {
              await tx.ticket.update({
                where: { ticket_by_seat: { idEvent, idPlace, idSector, idSeat } },
                data: { state: 'sold', idSale: sale.idSale, lineNumber },
              });
            } else {
              const newTicketId =
                (await tx.ticket.count({ where: { idEvent, idPlace, idSector } })) + 1;
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

          totalAsientos += ids.length;
          console.log('✅ [confirmSale] Grupo confirmado', {
            idEvent,
            idSector,
            seats: ids.length,
            lineNumber,
          });

          lineNumber++;
        }

        console.log('🏁 [confirmSale] Transacción OK — idSale:', sale.idSale, '| total asientos:', totalAsientos);
        return sale.idSale;
      });

      // OK final
      const porEvento = Array.from(eventQty.entries()).map(([evt, qty]) => `${evt}:${qty}`).join(', ');
      console.log('🎉 [confirmSale] Venta confirmada correctamente', {
        idSale,
        dniClient: Number(dniClient),
        eventos: porEvento,
      });

      res.status(200).json({ confirmed: true, idSale });
    } catch (error: any) {
      console.error('❌ [confirmSale] Error:', error?.message || error);
      res.status(409).json({ error: error?.message || 'No se pudo confirmar la venta' });
    }
  }



  // ✅ OBTENER TICKETS DEL USUARIO (con displayName simple)
  public async getUserTickets(req: AuthRequest, res: Response): Promise<void> {
    const dniClient = req.auth?.dni;

    if (!dniClient) {
      res.status(401).json({ error: 'No autorizado o DNI no encontrado en el token.' });
      return;
    }

    try {
      const sales = await prisma.sale.findMany({
        where: { dniClient },
        select: { idSale: true },
      });

      if (sales.length === 0) {
        res.status(200).json({ data: [] });
        return;
      }

      const saleIds = sales.map(s => s.idSale);

      const userTickets = await prisma.ticket.findMany({
        where: { idSale: { in: saleIds }, state: 'sold' },
        include: {
          event: { include: { place: true } },
          eventSector: { include: { sector: true } },
        },
        orderBy: { event: { date: 'asc' } },
      });

      const formatted = userTickets.map(t => {
        const sec = t.eventSector.sector;
        const sectorType = String(sec.sectorType || '').toLowerCase();
        const isNonEnumerated = sectorType === 'nonenumerated';
        const sectorDisplayName = isNonEnumerated ? 'Entrada General' : sec.name;

        return {
          id: `${t.idEvent}-${t.idTicket}`,
          eventId: t.idEvent,
          eventName: t.event.name,
          date: t.event.date.toISOString(),
          time:
            new Date(t.event.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs',
          location: t.event.place.name,
          sectorName: sec.name,
          sectorDisplayName,
          sectorType: sec.sectorType as any,
          seatNumber: t.idSeat,
          imageUrl: t.event.image
            ? `${process.env.BACKEND_URL || 'http://localhost:3000'}${t.event.image}`
            : '/ticket.png',
          idTicket: t.idTicket,
          idSale: t.idSale,
        };
      });

      res.status(200).json({ data: formatted });
    } catch (error: any) {
      console.error('Error fetching user tickets:', error?.message || error);
      res.status(500).json({ error: 'Error interno del servidor', details: error?.message });
    }
  }
}

export default new SalesController();
