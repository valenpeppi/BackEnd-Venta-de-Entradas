import express from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';
import crypto from 'crypto';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const toMinorUnits = (v: number) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount');
  return Math.round(n);
};

router.post('/checkout', async (req, res) => {
  const reservedForRollback: Array<{ idEvent: number; idPlace: number; idSector: number; ids: number[] }> = [];

  try {
    console.log('🔍 Stripe checkout iniciado');

    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    // validaciones simples
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }
    if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
    }
    if (!dniClient || !customerEmail) {
      return res.status(400).json({ error: 'Faltan datos del cliente (dniClient, customerEmail)' });
    }

    // procesar cada grupo
    for (const g of ticketGroups) {
      let idEvent = Number(g.idEvent);
      let idPlace = Number(g.idPlace);
      let idSector = Number(g.idSector);

      if (!idEvent || !idPlace) {
        return res.status(400).json({ error: 'ticketGroup inválido: faltan idEvent o idPlace' });
      }

      // buscar sector; si no existe o es 0, intentar fallback a primer sector no-enumerado del lugar
      let sector = await prisma.sector.findUnique({
        where: { idSector_idPlace: { idSector, idPlace } },
        select: { idSector: true, sectorType: true, name: true },
      });

      if (!sector) {
        if (!idSector || idSector === 0) {
          sector = await prisma.sector.findFirst({
            where: { idPlace, sectorType: 'nonEnumerated' },
            select: { idSector: true, sectorType: true, name: true },
          });
          if (!sector) {
            return res.status(400).json({ error: `No se encontró un sector no enumerado para el lugar ${idPlace}` });
          }
          idSector = sector.idSector;
        } else {
          return res.status(400).json({ error: `Sector ${idSector} en lugar ${idPlace} no existe` });
        }
      }

      const sectorType = sector.sectorType; // 'enumerated' | 'nonEnumerated'
      const incomingIds = Array.isArray(g.ids)
        ? g.ids.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n) && n > 0)
        : [];
      const qtyFromBody = Number(g.quantity);
      const quantity = Number.isFinite(qtyFromBody) ? qtyFromBody : (incomingIds.length > 0 ? incomingIds.length : 0);

      // ------- RESERVA -------
      if (sectorType === 'nonEnumerated') {
        // ignorar ids del front; usar quantity
        if (!quantity || quantity <= 0) {
          return res.status(400).json({ error: 'Para sector no enumerado se requiere quantity > 0' });
        }

        const totalAvailable = await prisma.seatEvent.count({
          where: { idEvent, idPlace, idSector, state: 'available' },
        });
        if (totalAvailable < quantity) {
          return res.status(400).json({ error: `No hay suficientes entradas disponibles para el evento ${idEvent}` });
        }

        const seatsToReserve = await prisma.seatEvent.findMany({
          where: { idEvent, idPlace, idSector, state: 'available' },
          take: quantity,
          orderBy: { idSeat: 'asc' },
          select: { idSeat: true },
        });

        const seatIds = seatsToReserve.map(s => s.idSeat);
        if (seatIds.length !== quantity) {
          return res.status(500).json({ error: 'No se pudo completar la reserva (no enumerado)' });
        }

        const upd = await prisma.seatEvent.updateMany({
          where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'available' },
          data: { state: 'reserved' },
        });
        if (upd.count !== seatIds.length) {
          // carrera: liberar por las dudas
          await prisma.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'reserved' },
            data: { state: 'available' },
          });
          return res.status(409).json({ error: 'Conflicto de concurrencia reservando entradas' });
        }

        // guardamos ids definitivos en el mismo objeto (para metadata)
        g.ids = seatIds;
        g.idSector = idSector; // por si cayó en fallback
        reservedForRollback.push({ idEvent, idPlace, idSector, ids: seatIds });
      } else {
        // enumerado
        if (incomingIds.length > 0) {
          const availableCount = await prisma.seatEvent.count({
            where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'available' },
          });
          if (availableCount !== incomingIds.length) {
            return res.status(400).json({ error: `Algunos asientos ya no están disponibles (evento ${idEvent}, sector ${idSector})` });
          }

          const upd = await prisma.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'available' },
            data: { state: 'reserved' },
          });
          if (upd.count !== incomingIds.length) {
            // carrera: liberar por las dudas
            await prisma.seatEvent.updateMany({
              where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'reserved' },
              data: { state: 'available' },
            });
            return res.status(409).json({ error: 'Conflicto de concurrencia reservando asientos' });
          }

          g.ids = incomingIds;
          reservedForRollback.push({ idEvent, idPlace, idSector, ids: incomingIds });
        } else if (quantity && quantity > 0) {
          const seatsToReserve = await prisma.seatEvent.findMany({
            where: { idEvent, idPlace, idSector, state: 'available' },
            take: quantity,
            orderBy: { idSeat: 'asc' },
            select: { idSeat: true },
          });
          if (seatsToReserve.length < quantity) {
            return res.status(400).json({ error: `No hay suficientes asientos disponibles (evento ${idEvent}, sector ${idSector})` });
          }

          const seatIds = seatsToReserve.map(s => s.idSeat);
          const upd = await prisma.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'available' },
            data: { state: 'reserved' },
          });
          if (upd.count !== seatIds.length) {
            // carrera: liberar por las dudas
            await prisma.seatEvent.updateMany({
              where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'reserved' },
              data: { state: 'available' },
            });
            return res.status(409).json({ error: 'Conflicto de concurrencia reservando asientos' });
          }

          g.ids = seatIds;
          reservedForRollback.push({ idEvent, idPlace, idSector, ids: seatIds });
        } else {
          return res.status(400).json({ error: 'Para sectores enumerados se requieren ids[] o quantity > 0' });
        }
      }
    }

    // construir line_items
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'ars',
        product_data: { name: String(item.name || 'Entrada').slice(0, 120) },
        unit_amount: toMinorUnits(Number(item.amount)), // esperamos centavos
      },
      quantity: Number(item.quantity) || 1,
    }));

    // idempotencia por dni + contenido (ya con ids definitivos)
    const idemKey = crypto
      .createHash('sha256')
      .update(`${dniClient}:${customerEmail}:${JSON.stringify(ticketGroups)}`)
      .digest('hex');

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        customer_email: customerEmail,
        success_url: `${FRONTEND_URL}/pay/processing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/pay/failure`,
        metadata: {
          dniClient: String(dniClient),
          ticketGroups: JSON.stringify(ticketGroups), // ya contiene g.ids finales
        },
      },
      { idempotencyKey: idemKey }
    );

    console.log('✅ Sesión de Stripe creada:', session.id);
    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Error creando sesión de Stripe:', error?.message || error);

    // rollback best-effort
    try {
      for (const r of reservedForRollback) {
        if (!r.ids || r.ids.length === 0) continue;
        await prisma.seatEvent.updateMany({
          where: {
            idEvent: r.idEvent,
            idPlace: r.idPlace,
            idSector: r.idSector,
            idSeat: { in: r.ids },
            state: 'reserved',
          },
          data: { state: 'available', idSale: null, lineNumber: null },
        });
      }
    } catch (e) {
      console.warn('⚠️ Falló el rollback de reservas:', e);
    }

    return res.status(500).json({ error: error?.message || 'No se pudo iniciar el pago' });
  }
});

// Liberar reservas manualmente (fallback desde frontend) — SIN CAMBIOS
router.post('/release', async (req, res) => {
  try {
    const { ticketGroups } = req.body as { ticketGroups: Array<any> };
    if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'ticketGroups inválido' });
    }

    let totalReleased = 0;
    for (const g of ticketGroups) {
      const idEvent = Number(g.idEvent);
      const idPlace = Number(g.idPlace);
      const idSector = Number(g.idSector);
      const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number).filter(Number.isFinite) : [];
      if (!idEvent || !idPlace || !idSector || ids.length === 0) continue;

      const updated = await prisma.seatEvent.updateMany({
        where: { idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'reserved' },
        data: { state: 'available', idSale: null, lineNumber: null },
      });
      totalReleased += updated.count;
    }

    return res.status(200).json({ released: totalReleased });
  } catch (error: any) {
    console.error('❌ Error liberando reservas manualmente:', error?.message || error);
    return res.status(500).json({ error: 'Error liberando reservas' });
  }
});

// Confirmar por session_id — SIN CAMBIOS
router.get('/confirm-session', async (req, res) => {
  try {
    const sessionId = String(req.query.session_id || '');
    if (!sessionId) {
      return res.status(400).json({ error: 'session_id requerido' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const paid =
      session.payment_status === 'paid' ||
      (session.status === 'complete' && session.payment_status !== 'unpaid');

    if (!paid) {
      return res.status(409).json({ error: 'El pago aún no está confirmado' });
    }

    let dniClient: number | null = null;
    let ticketGroups: any[] = [];
    try {
      dniClient = session?.metadata?.dniClient ? Number(session.metadata.dniClient) : null;
      ticketGroups = session?.metadata?.ticketGroups ? JSON.parse(session.metadata.ticketGroups) : [];
    } catch (e) {}

    if (!dniClient || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'Metadata incompleta para confirmar la venta' });
    }

    const anySold = await prisma.seatEvent.count({
      where: {
        OR: ticketGroups.flatMap((g: any) => {
          const idEvent = Number(g.idEvent);
          const idPlace = Number(g.idPlace);
          const idSector = Number(g.idSector);
          const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number) : [];
          if (!idEvent || !idPlace || !idSector || ids.length === 0) return [];
          return [{ idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'sold' }];
        }),
      },
    });

    if (anySold > 0) {
      return res.status(200).json({ confirmed: true, message: 'Venta ya confirmada previamente' });
    }

    const mockReq = { body: { dniClient, tickets: ticketGroups }, auth: { dni: dniClient } } as any;
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => ({ code, data }),
      }),
    } as any;

    await SalesController.confirmSale(mockReq, mockRes);
    return res.status(200).json({ confirmed: true });
  } catch (err: any) {
    console.error('❌ Error confirmando por session_id:', err?.message || err);
    return res.status(500).json({ error: 'No se pudo confirmar la venta por session_id' });
  }
});

export default router;
