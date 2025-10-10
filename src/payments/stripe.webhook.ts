import express, { Request, Response } from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';

const router = express.Router();

router.post(
  '/',
  // IMPORTANTE: este raw debe ejecutarse ANTES de cualquier express.json() global
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    console.log("📩 Webhook Stripe recibido");

    // 1) Verificación de firma
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error("❌ Falta header 'stripe-signature'");
      // En test, devolvemos 200 para evitar reintentos infinitos molestos
      return res.status(200).json({ ignored: true, reason: 'missing-signature' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET no configurado');
      return res.status(200).json({ ignored: true, reason: 'missing-webhook-secret' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log(`✅ Firma verificada. Tipo: ${event.type}`);
    } catch (err: any) {
      console.error('❌ Verificación de firma falló:', err.message);
      // En test: 200 para que no siga reintentando mientras debuggeás
      return res.status(200).json({ ignored: true, reason: 'invalid-signature' });
    }

    // Utilizaremos session sólo para eventos de checkout
    const session = event.data?.object as any;

    // Helper: parseo seguro de metadata
    const parseMetadata = () => {
      try {
        const dniClient = session?.metadata?.dniClient
          ? Number(session.metadata.dniClient)
          : null;
        const ticketGroups = session?.metadata?.ticketGroups
          ? JSON.parse(session.metadata.ticketGroups)
          : [];

        return { dniClient, ticketGroups };
      } catch (e) {
        console.error("❌ No se pudo parsear metadata:", e);
        return { dniClient: null, ticketGroups: [] as any[] };
      }
    };

    // ✅ Pago completado
    if (event.type === 'checkout.session.completed') {
      console.log("💳 checkout.session.completed");

      const { dniClient, ticketGroups } = parseMetadata();
      if (!dniClient || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
        console.warn("⚠️ Metadata incompleta. No confirmo venta.");
        return res.status(200).json({ ignored: true, reason: 'incomplete-metadata' });
      }

      try {
        // IDEMPOTENCIA SIN SCHEMA: verificamos si ALGUNO de los asientos ya está vendido.
        // Como en /checkout ya reservaste y guardaste g.ids (para sector 0 y enumerado),
        // podemos chequear estado real en seatEvent.
        const anySold = await prisma.seatEvent.count({
          where: {
            OR: ticketGroups.flatMap((g: any) => {
              const idEvent = Number(g.idEvent);
              const idPlace = Number(g.idPlace);
              const idSector = Number(g.idSector);
              const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number) : [];

              if (!idEvent || !idPlace || !idSector || ids.length === 0) return [];
              return [{
                idEvent,
                idPlace,
                idSector,
                idSeat: { in: ids },
                state: 'sold',
              }];
            }),
          },
        });

        if (anySold > 0) {
          console.log(`⚠️ Ya hay asientos en estado 'sold'. Evito doble confirmación.`);
          return res.status(200).json({ message: 'already-confirmed' });
        }

        // Si no hay sold, intentamos confirmar la venta.
        console.log("📞 Llamando a SalesController.confirmSale (desde webhook) ...");

        // Mock de req/res para reutilizar el controlador
        const mockReq = {
          body: { dniClient, tickets: ticketGroups },
          auth: { dni: dniClient },
        } as any;

        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => {
              console.log("✅ Respuesta confirmSale:", code, data);
              return { code, data };
            },
          }),
        } as any;

        await SalesController.confirmSale(mockReq, mockRes);

        // Nota: SalesController ya maneja duplicados buscando tickets 'sold'.
        // Si dos procesos llegan a la vez, uno verá duplicados y NO creará una nueva venta.
        // En entornos de prueba esto suele ser suficiente.

        console.log("✅ Venta confirmada vía webhook");
        return res.status(200).json({ received: true });
      } catch (error: any) {
        console.error('❌ Error al confirmar venta desde webhook:', error?.message || error);
        // En test: respondemos 200 para que no reintente en loop mientras depurás
        return res.status(200).json({ received: true, softError: true });
      }
    }

    // Pago expirado o fallido: liberar entradas reservadas
    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      console.log(`🛑 Evento de pago no exitoso: ${event.type}`);

      const { ticketGroups } = parseMetadata();
      if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
        console.warn("⚠️ No hay ticketGroups en metadata para liberar.");
        return res.status(200).json({ released: false });
      }

      try {
        for (const g of ticketGroups) {
          const idEvent = Number(g.idEvent);
          const idPlace = Number(g.idPlace);
          const idSector = Number(g.idSector);
          const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number) : [];

          if (!idEvent || !idPlace || !idSector || ids.length === 0) {
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

          console.log(`✔️ Liberadas ${updated.count} entradas reservadas (event ${idEvent}, sector ${idSector})`);
        }

        return res.status(200).json({ released: true });
      } catch (error: any) {
        console.error('❌ Error liberando entradas:', error?.message || error);
        return res.status(200).json({ released: false, softError: true });
      }
    }

    // Otros eventos: OK
    return res.status(200).json({ received: true });
  }
);

export default router;
