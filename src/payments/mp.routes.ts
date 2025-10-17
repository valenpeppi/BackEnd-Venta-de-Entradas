import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { preferences } from './mp.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';

const router = express.Router();

const FRONTEND_URL = (process.env.FRONTEND_URL || '').trim();
const BACKEND_URL = (process.env.BACKEND_URL || '').trim();
const MP_ACCESS_TOKEN = (process.env.MP_ACCESS_TOKEN || '').trim();

function assertEnv() {
  const missing: string[] = [];
  if (!FRONTEND_URL) missing.push('FRONTEND_URL');
  if (!BACKEND_URL) missing.push('BACKEND_URL');
  if (!MP_ACCESS_TOKEN) missing.push('MP_ACCESS_TOKEN');

  if (missing.length) {
    const msg = `Faltan variables de entorno requeridas: ${missing.join(', ')}`;
    console.error('❌', msg);
    return msg;
  }
  return null;
}


async function normalizeAndReserve(ticketGroups: any[]) {
  for (const g of ticketGroups) {
    const idEvent = Number(g.idEvent);
    const idPlace = Number(g.idPlace);
    const idSector = Number(g.idSector);

    if (!idEvent || !idPlace || !idSector) {
      throw new Error('ticketGroup inválido: faltan idEvent/idPlace/idSector');
    }

    const sector = await prisma.sector.findUnique({
      where: { idSector_idPlace: { idSector, idPlace } },
      select: { sectorType: true, name: true },
    });

    if (!sector) throw new Error(`Sector ${idSector} en lugar ${idPlace} no existe`);

    const sectorType = sector.sectorType; // 'enumerated' | 'nonEnumerated'
    const incomingIds: number[] = Array.isArray(g.ids)
      ? g.ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];
    const qtyFromBody = Number(g.quantity);
    const quantity = Number.isFinite(qtyFromBody) ? qtyFromBody : (incomingIds.length > 0 ? incomingIds.length : 0);

    if (sectorType === 'nonEnumerated') {
      if (!quantity || quantity <= 0) {
        throw new Error(`Para sector no enumerado se requiere quantity > 0`);
      }

      const totalAvailable = await prisma.seatEvent.count({
        where: { idEvent, idPlace, idSector, state: 'available' },
      });
      if (totalAvailable < quantity) {
        throw new Error(`No hay suficientes entradas disponibles`);
      }

      const seatsToReserve = await prisma.seatEvent.findMany({
        where: { idEvent, idPlace, idSector, state: 'available' },
        take: quantity,
        orderBy: { idSeat: 'asc' },
      });

      const seatIds = seatsToReserve.map((s) => s.idSeat);
      await prisma.seatEvent.updateMany({
        where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'available' },
        data: { state: 'reserved' },
      });

      g.ids = seatIds;
    } else {
      if (incomingIds.length > 0) {
        const availableCount = await prisma.seatEvent.count({
          where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'available' },
        });
        if (availableCount !== incomingIds.length) {
          throw new Error(`Algunos asientos ya no están disponibles`);
        }
        await prisma.seatEvent.updateMany({
          where: { idEvent, idPlace, idSector, idSeat: { in: incomingIds }, state: 'available' },
          data: { state: 'reserved' },
        });
        g.ids = incomingIds;
      } else if (quantity && quantity > 0) {
        const seatsToReserve = await prisma.seatEvent.findMany({
          where: { idEvent, idPlace, idSector, state: 'available' },
          take: quantity,
          orderBy: { idSeat: 'asc' },
        });
        if (seatsToReserve.length < quantity) {
          throw new Error(`No hay suficientes asientos disponibles`);
        }
        const seatIds = seatsToReserve.map((s) => s.idSeat);
        await prisma.seatEvent.updateMany({
          where: { idEvent, idPlace, idSector, idSeat: { in: seatIds }, state: 'available' },
          data: { state: 'reserved' },
        });
        g.ids = seatIds;
      } else {
        throw new Error('Para sectores enumerados se requieren ids[] o quantity > 0');
      }
    }
  }
}

router.post('/checkout', async (req, res) => {
  try {
    console.log('🔁 MercadoPago checkout iniciado');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

    const envError = assertEnv();
    if (envError) return res.status(500).json({ error: envError });

    const { items, dniClient, ticketGroups, customerEmail } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems válidos' });
    }
    if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
    }
    if (!dniClient || !customerEmail) {
      return res.status(400).json({ error: 'Faltan datos del cliente (dniClient, customerEmail)' });
    }

    console.log('🎫 Procesando ticketGroups:', ticketGroups);
    await normalizeAndReserve(ticketGroups);

    const external_reference = crypto
      .createHash('sha256')
      .update(`${dniClient}:${customerEmail}:${JSON.stringify(ticketGroups)}`)
      .digest('hex');

    const successUrl = `${FRONTEND_URL}/pay/processing`; 
    const failureUrl = `${FRONTEND_URL}/pay/failure`;
    const pendingUrl = `${FRONTEND_URL}/pay/failure`;
    const notificationUrl = `${BACKEND_URL}/api/mp/webhook`;

    console.log('🔗 MP back_urls: ', { successUrl, failureUrl, pendingUrl, notificationUrl });

    console.log('💳 Creando preferencia en MercadoPago...');
    const pref = await preferences.create({
      body: {
        items: items.map((item: any, index: number) => {
          const unit_price = Math.round(Number(item.amount)) / 100; 
          if (!Number.isFinite(unit_price) || unit_price <= 0) {
            throw new Error('Monto inválido en ítems');
          }
          return {
            id: item.id?.toString() || String(index),
            title: String(item.name).slice(0, 120),
            quantity: Number(item.quantity) || 1,
            unit_price,
            currency_id: 'ARS',
          };
        }),
        payer: { email: customerEmail }, 
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },

        notification_url: notificationUrl,
        metadata: {
          dniClient: String(dniClient),
          ticketGroups: JSON.stringify(ticketGroups),
        },
        external_reference,
      },
    });

    console.log('✅ Preferencia creada:', pref.id);
    res.json({ preferenceId: pref.id, init_point: pref.init_point });
  } catch (error: any) {
    console.error('❌ Error creando preferencia MP:', error?.response?.data || error?.message || error);
    res.status(500).json({ error: error?.message || 'No se pudo crear la preferencia' });
  }
});


router.get('/confirm-payment', async (req, res) => {
  try {
    const envError = assertEnv();
    if (envError) return res.status(500).json({ error: envError });

    const paymentId = String(req.query.payment_id || '');
    if (!paymentId) {
      return res.status(400).json({ error: 'payment_id requerido' });
    }

    const mpRes = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    const payment = mpRes.data;
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });

    const status = payment.status; // 'approved', 'rejected', ...
    const metadata = payment.metadata || {};
    const dniClient = Number(metadata.dniClient);
    const ticketGroups = metadata.ticketGroups ? JSON.parse(metadata.ticketGroups) : [];

    if (!dniClient || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
      return res.status(400).json({ error: 'Metadata incompleta' });
    }

    if (status !== 'approved') {
      return res.status(409).json({ error: 'El pago no está aprobado aún', status });
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
  } catch (error: any) {
    console.error('❌ Error confirmando pago MP:', error?.response?.data || error?.message || error);
    return res.status(500).json({ error: 'No se pudo confirmar la venta por payment_id' });
  }
});

export default router;
