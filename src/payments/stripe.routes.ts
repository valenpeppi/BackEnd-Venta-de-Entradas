import express from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller'; 
import crypto from 'crypto';

const router = express.Router();

const toMinorUnits = (v: number) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount');
  return Math.round(n);
};

router.post('/checkout', async (req, res) => {
  try {
    console.log('🔍 Stripe checkout iniciado');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }
    if (!ticketGroups || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
    }
    if (!dniClient || !customerEmail) {
      return res.status(400).json({ error: 'Faltan datos del cliente (dniClient, customerEmail)' });
    }

    console.log('🎫 Procesando ticketGroups:', ticketGroups);

    for (const g of ticketGroups) {
      const idEvent = Number(g.idEvent);
      const idPlace = Number(g.idPlace);
      const idSector = Number(g.idSector);

      if (!idEvent || !idPlace || !idSector) {
        return res.status(400).json({ error: 'ticketGroup inválido: faltan idEvent/idPlace/idSector' });
      }

      const sector = await prisma.sector.findUnique({
        where: { idSector_idPlace: { idSector, idPlace } },
        select: { sectorType: true, name: true },
      });

      if (!sector) {
        return res.status(400).json({ error: `Sector ${idSector} en lugar ${idPlace} no existe` });
      }

      const sectorType = sector.sectorType; 
      const incomingIds: number[] = Array.isArray(g.ids)
        ? (g.ids as (number | string)[]).map(Number).filter((n) => Number.isFinite(n) && n > 0)
        : [];
      const qtyFromBody = Number(g.quantity);
      const quantity = Number.isFinite(qtyFromBody) ? qtyFromBody : (incomingIds.length > 0 ? incomingIds.length : 0);

      console.log('🔍 Grupo normalizado:', {
        idEvent, idPlace, idSector, sectorType, quantity, ids: incomingIds,
      });

      if (sectorType === 'nonEnumerated') {
        if (!quantity || quantity <= 0) {
          return res.status(400).json({ error: `Para sector no enumerado se requiere quantity > 0` });
        }

        const totalAvailable = await prisma.seatEvent.count({
          where: { idEvent, idPlace, idSector, state: 'available' },
        });

        console.log(`📊 (No enumerado) disponibles: ${totalAvailable}, solicitadas: ${quantity}`);
        if (totalAvailable < quantity) {
          return res.status(400).json({ error: `No hay suficientes entradas disponibles para el evento ${idEvent}` });
        }

        const seatsToReserve = await prisma.seatEvent.findMany({
          where: { idEvent, idPlace, idSector, state: 'available' },
          take: quantity,
          orderBy: { idSeat: 'asc' },
        });

        const seatIds = seatsToReserve.map((s) => s.idSeat);
        if (seatIds.length !== quantity) {
          return res.status(500).json({ error: 'No se pudo completar la reserva (no enumerado)' });
        }

        await prisma.seatEvent.updateMany({
          where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'available' },
          data: { state: 'reserved' },
        });

        g.ids = seatIds;
        console.log('✅ No enumerado: asientos (abstractos) reservados:', seatIds);
      } else {
        if (incomingIds.length > 0) {
          const availableCount = await prisma.seatEvent.count({
            where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'available' },
          });
          if (availableCount !== incomingIds.length) {
            return res.status(400).json({
              error: `Algunos asientos ya no están disponibles para el evento ${idEvent}, sector ${idSector}`,
            });
          }

          await prisma.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'available' },
            data: { state: 'reserved' },
          });

          g.ids = incomingIds;
          console.log('✅ Enumerado: asientos reservados (por IDs):', incomingIds);
        } else if (quantity && quantity > 0) {
          const seatsToReserve = await prisma.seatEvent.findMany({
            where: { idEvent, idPlace, idSector, state: 'available' },
            take: quantity,
            orderBy: { idSeat: 'asc' },
          });
          if (seatsToReserve.length < quantity) {
            return res.status(400).json({
              error: `No hay suficientes asientos disponibles para el evento ${idEvent}, sector ${idSector}`,
            });
          }

          const seatIds = seatsToReserve.map((s) => s.idSeat);
          await prisma.seatEvent.updateMany({
            where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'available' },
            data: { state: 'reserved' },
          });

          g.ids = seatIds;
          console.log('✅ Enumerado: asientos reservados (por cantidad):', seatIds);
        } else {
          return res.status(400).json({ error: 'Para sectores enumerados se requieren ids[] o quantity > 0' });
        }
      }
    }

    console.log('💳 Creando sesión de Stripe...');

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'ars',
        product_data: { name: String(item.name).slice(0, 120) },
        unit_amount: toMinorUnits(Number(item.amount)), 
      },
      quantity: Number(item.quantity) || 1,
    }));

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
        success_url: `${process.env.FRONTEND_URL}/pay/processing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/pay/failure`,
        metadata: {
          dniClient: String(dniClient),
          ticketGroups: JSON.stringify(ticketGroups),
        },
      },
      { idempotencyKey: idemKey }
    );

    console.log('✅ Sesión de Stripe creada:', session.id);
    console.log('🔗 URL de checkout:', session.url);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Error creando sesión de Stripe:', error);
    res.status(500).json({ error: error.message || 'No se pudo iniciar el pago' });
  }
});

router.post('/release', async (req, res) => {
  try {
    const { ticketGroups } = req.body as { ticketGroups: Array<any> };

    console.log('🔄 Solicitud de liberación manual recibida:', ticketGroups);

    if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'ticketGroups inválido' });
    }

    let totalReleased = 0;

    for (const g of ticketGroups) {
      const idEvent = Number(g.idEvent);
      const idPlace = Number(g.idPlace);
      const idSector = Number(g.idSector);
      const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number).filter(Number.isFinite) : [];

      if (!idEvent || !idPlace || !idSector || ids.length === 0) {
        console.warn('⚠️ Grupo inválido para liberar. Saltando:', g);
        continue;
      }

      const updated = await prisma.seatEvent.updateMany({
        where: {
          idEvent,
          idPlace,
          idSector,
          idSeat: { in: ids },
          state: 'reserved',
        },
        data: {
          state: 'available',
          idSale: null,
          lineNumber: null,
        },
      });

      totalReleased += updated.count;
      console.log(`✔️ Liberadas ${updated.count} reservas (event ${idEvent}, sector ${idSector})`);
    }

    return res.status(200).json({ released: totalReleased });
  } catch (error: any) {
    console.error('❌ Error liberando reservas manualmente:', error?.message || error);
    return res.status(500).json({ error: 'Error liberando reservas' });
  }
});

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
