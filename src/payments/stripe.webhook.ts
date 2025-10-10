import express, { Request, Response } from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    console.log("📩 Webhook recibido");

    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error("❌ No se encontró la firma de Stripe en headers");
      return res.status(400).send("Missing Stripe signature");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET no está configurado');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log(`✅ Webhook verificado con tipo: ${event.type}`);
    } catch (err: any) {
      console.error('❌ Falló la verificación del webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 💳 PAGO COMPLETADO
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      console.log("💳 Evento de pago completado recibido desde Stripe");

      try {
        const dniClient = session.metadata?.dniClient
          ? Number(session.metadata.dniClient)
          : null;
        const ticketGroups = JSON.parse(session.metadata?.ticketGroups || '[]');

        console.log("📦 Metadata recibida desde Stripe:");
        console.log("dniClient:", dniClient);
        console.log("ticketGroups:", ticketGroups);

        if (!dniClient || !ticketGroups.length) {
          console.warn("⚠️ Metadata incompleta. No se confirma la venta.");
          return res.status(400).send("Metadata incompleta");
        }

        console.log("📞 Llamando a SalesController.confirmSale...");
    
    
    console.log("🧪 Ejecutando confirmSale manual desde webhook...");

    await SalesController.confirmSale(
      {
        body: { dniClient, tickets: ticketGroups },
        auth: { dni: dniClient },
      } as any,
      {
        status: (code: number) => {
          return {
            json: (data: any) => {
              console.log("✅ confirmSale mock response:", code, data);
              return { code, data };
            }
          };
        },
      } as any
    );


        console.log("✅ Venta confirmada desde webhook");
      } catch (error: any) {
        console.error('❌ Error ejecutando confirmSale desde webhook:', error.message || error);
      }
    }

    // 🛑 PAGO FALLIDO O EXPIRADO
    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as any;
      console.log(`🛑 Evento de pago fallido o expirado: ${event.type}`);

      try {
        const ticketGroups = JSON.parse(session.metadata?.ticketGroups || '[]');
        console.log("🔄 Liberando entradas reservadas:", ticketGroups);

        for (const g of ticketGroups) {
          const { idEvent, idPlace, idSector, ids } = g;
          if (!idEvent || !idPlace || !idSector || !ids?.length) {
            console.warn("⚠️ Grupo inválido. Saltando:", g);
            continue;
          }

          const updated = await prisma.seatEvent.updateMany({
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

          console.log(`✔️ Liberadas ${updated.count} entradas reservadas`);
        }
      } catch (error: any) {
        console.error('❌ Error liberando entradas:', error.message || error);
      }
    }

    res.json({ received: true });
  }
);

export default router;
