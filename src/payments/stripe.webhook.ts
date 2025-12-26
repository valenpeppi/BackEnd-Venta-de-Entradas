import express, { Request, Response } from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';
import { webhookRateLimit } from '../middlewares/rateLimit';
import { env } from '../config/env';

const STRIPE_WEBHOOK = (env.STRIPE_WEBHOOK_SECRET ?? '') as string;

const router = express.Router();

router.post(
  '/',
  webhookRateLimit,
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    console.log('📩 Webhook Stripe recibido');

    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error("❌ Falta header 'stripe-signature'");
      return res.status(200).json({ ignored: true, reason: 'missing-signature' });
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK);
      console.log(`✅ Firma verificada. Tipo: ${event.type}`);
    } catch (err: any) {
      console.error('❌ Verificación de firma falló:', err.message);
      return res.status(200).json({ ignored: true, reason: 'invalid-signature' });
    }

    const session = event.data?.object as any;

    const parseMetadata = () => {
      try {
        const dniClient = session?.metadata?.dniClient ? Number(session.metadata.dniClient) : null;
        const ticketGroups = session?.metadata?.ticketGroups ? JSON.parse(session.metadata.ticketGroups) : [];
        return { dniClient, ticketGroups };
      } catch (e) {
        console.error('❌ No se pudo parsear metadata:', e);
        return { dniClient: null, ticketGroups: [] as any[] };
      }
    };

    const confirm = async () => {
      const { dniClient, ticketGroups } = parseMetadata();
      if (!dniClient || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
        return res.status(200).json({ ignored: true, reason: 'incomplete-metadata' });
      }

      const anySold = await prisma.seatEvent.count({
        where: {
          OR: ticketGroups.flatMap((g: any) => {
            const idEvent = String(g.idEvent);
            const idPlace = String(g.idPlace);
            const idSector = Number(g.idSector);
            const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number) : [];
            if (!idEvent || !idPlace || !idSector || ids.length === 0) return [];
            return [{ idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'sold' }];
          }),
        },
      });
      if (anySold > 0) {
        console.log('ℹ️ Tickets ya confirmados previamente');
        return res.status(200).json({ message: 'already-confirmed' });
      }

      const mockReq = { body: { dniClient, tickets: ticketGroups }, auth: { dni: dniClient } } as any;
      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log('✅ Respuesta confirmSale:', code, data);
            return { code, data };
          },
        }),
      } as any;

      await SalesController.confirmSale(mockReq, mockRes);
      return res.status(200).json({ received: true });
    };

    const release = async () => {
      const { ticketGroups } = parseMetadata();
      if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
        return res.status(200).json({ released: false });
      }
      for (const g of ticketGroups) {
        const idEvent = String(g.idEvent);
        const idPlace = String(g.idPlace);
        const idSector = Number(g.idSector);
        const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number) : [];
        if (!idEvent || !idPlace || !idSector || ids.length === 0) continue;

        await prisma.seatEvent.updateMany({
          where: { idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'reserved' },
          data: { state: 'available', idSale: null, lineNumber: null },
        });
      }
      return res.status(200).json({ released: true });
    };

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        return confirm();
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        return release();
      default:
        return res.status(200).json({ received: true });
    }
  }
);

export default router;
