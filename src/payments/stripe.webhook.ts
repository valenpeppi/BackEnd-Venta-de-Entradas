import express, { Request, Response } from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';

const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET no está configurado');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`➡️ Stripe event recibido: ${event.type}`);

    // ✅ Pago completado → confirmamos venta
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      try {
        const dniClient = session.metadata?.dniClient
          ? Number(session.metadata.dniClient)
          : null;
        const ticketGroups = JSON.parse(session.metadata?.ticketGroups || '[]');

        console.log("✅ Confirmando venta para:", { dniClient, ticketGroups });

        // Reusar SalesController.confirmSale
        await SalesController.confirmSale(
          { body: { dniClient, tickets: ticketGroups } } as any,
          {
            status: (code: number) => ({
              json: (data: any) =>
                console.log("➡️ confirmSale response:", code, data),
            }),
          } as any
        );
      } catch (error) {
        console.error('❌ Error confirmando venta desde webhook:', error);
      }
    }

    // ❌ Pago fallido o expirado → liberar tickets reservados
    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as any;

      try {
        const ticketGroups = JSON.parse(session.metadata?.ticketGroups || '[]');

        console.log("♻️ Liberando tickets reservados:", ticketGroups);

        for (const g of ticketGroups) {
          const idEvent = Number(g.idEvent);
          const idPlace = Number(g.idPlace);
          const idSector = Number(g.idSector);
          const ids = Array.isArray(g.ids)
            ? g.ids.map((id: any) => Number(id))
            : [];

          if (!idEvent || !idPlace || !idSector || ids.length === 0) continue;

          await prisma.seatEvent.updateMany({
            where: {
              idSeat: { in: ids },
              idEvent,
              idPlace,
              idSector,
              state: 'reserved',
            },
            data: {
              state: 'available',
              idSale: null,
              lineNumber: null,
            },
          });
        }
      } catch (error) {
        console.error('❌ Error liberando tickets en fallo Stripe:', error);
      }
    }

    res.json({ received: true });
  }
);

export default router;
